/**
 * RuleParser Utility
 * Parses PERL rule files to extract rule metadata, conditions, and actions
 */

export class RuleParser {
    /**
     * Parse a PERL rule file content
     * @param {string} content - PERL rule file content
     * @returns {Object} Parsed rule data
     */
    static parseRuleFile(content) {
        if (!content) {
            return {
                header: null,
                rules: [],
                metadata: {}
            };
        }

        const lines = content.split('\n');
        const header = this.extractHeader(lines);
        const rules = this.extractRules(content);
        const metadata = this.extractMetadata(lines);

        return {
            header,
            rules,
            metadata,
            totalRules: rules.length,
            ruleIds: rules.map(r => r.id).filter(Boolean)
        };
    }

    /**
     * Extract file header information
     * @param {Array<string>} lines - File lines
     * @returns {Object} Header information
     */
    static extractHeader(lines) {
        const header = {
            description: '',
            author: '',
            created: '',
            lastModified: '',
            notes: []
        };

        let inHeader = false;
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Start of header block
            if (trimmed.startsWith('# ===')) {
                inHeader = true;
                continue;
            }
            
            // End of header block
            if (inHeader && trimmed === '#') {
                break;
            }
            
            if (inHeader && trimmed.startsWith('#')) {
                const content = trimmed.substring(1).trim();
                
                if (content.startsWith('Description:')) {
                    header.description = content.substring('Description:'.length).trim();
                } else if (content.startsWith('Author:')) {
                    header.author = content.substring('Author:'.length).trim();
                } else if (content.startsWith('Created:')) {
                    header.created = content.substring('Created:'.length).trim();
                } else if (content.startsWith('Last Modified:')) {
                    header.lastModified = content.substring('Last Modified:'.length).trim();
                } else if (content.startsWith('NOTE:') || content.startsWith('WARNING:')) {
                    header.notes.push(content);
                }
            }
        }

        return header;
    }

    /**
     * Extract metadata from comments
     * @param {Array<string>} lines - File lines
     * @returns {Object} Metadata
     */
    static extractMetadata(lines) {
        const metadata = {
            warnings: [],
            todos: [],
            notes: []
        };

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('# WARNING:')) {
                metadata.warnings.push(trimmed.substring('# WARNING:'.length).trim());
            } else if (trimmed.startsWith('# TODO:')) {
                metadata.todos.push(trimmed.substring('# TODO:'.length).trim());
            } else if (trimmed.startsWith('# NOTE:')) {
                metadata.notes.push(trimmed.substring('# NOTE:'.length).trim());
            }
        }

        return metadata;
    }

    /**
     * Extract individual rules from content
     * @param {string} content - File content
     * @returns {Array<Object>} Array of parsed rules
     */
    static extractRules(content) {
        const rules = [];
        const ruleBlocks = this.splitIntoRuleBlocks(content);

        for (const block of ruleBlocks) {
            const rule = this.parseRuleBlock(block);
            if (rule) {
                rules.push(rule);
            }
        }

        return rules;
    }

    /**
     * Split content into individual rule blocks
     * @param {string} content - File content
     * @returns {Array<string>} Array of rule blocks
     */
    static splitIntoRuleBlocks(content) {
        const blocks = [];
        const lines = content.split('\n');
        let currentBlock = [];
        let inRule = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Start of a rule block (comment header)
            if (trimmed.startsWith('# ---')) {
                if (currentBlock.length > 0) {
                    blocks.push(currentBlock.join('\n'));
                }
                currentBlock = [line];
                inRule = true;
            } else if (inRule) {
                currentBlock.push(line);
                
                // End of rule (END keyword)
                if (trimmed === 'END') {
                    blocks.push(currentBlock.join('\n'));
                    currentBlock = [];
                    inRule = false;
                }
            }
        }

        // Add last block if exists
        if (currentBlock.length > 0) {
            blocks.push(currentBlock.join('\n'));
        }

        return blocks;
    }

    /**
     * Parse a single rule block
     * @param {string} block - Rule block content
     * @returns {Object|null} Parsed rule or null
     */
    static parseRuleBlock(block) {
        const lines = block.split('\n');
        
        const rule = {
            id: null,
            name: null,
            description: '',
            priority: null,
            effect: null,
            conditions: [],
            actions: [],
            flags: [],
            comments: [],
            rawContent: block
        };

        let inComments = true;
        let inWhen = false;
        let inThen = false;

        for (const line of lines) {
            const trimmed = line.trim();

            // Extract rule ID and name from comment header
            if (trimmed.startsWith('# ') && !trimmed.startsWith('# ---')) {
                const comment = trimmed.substring(2);
                
                // Check for rule ID pattern (e.g., "ELG-001 | Credit Score Minimum")
                const idMatch = comment.match(/^([A-Z]+-\d+)\s*\|\s*(.+)$/);
                if (idMatch) {
                    rule.id = idMatch[1];
                    rule.name = idMatch[2].trim();
                } else if (comment && inComments) {
                    rule.comments.push(comment);
                }
            }

            // Parse RULE declaration
            if (trimmed.startsWith('RULE ')) {
                inComments = false;
                const ruleMatch = trimmed.match(/RULE\s+"([^"]+)"\s+PRIORITY\s+(\d+)\s+EFFECT\s+(\w+)/);
                if (ruleMatch) {
                    if (!rule.id) {
                        rule.id = ruleMatch[1];
                    }
                    rule.priority = parseInt(ruleMatch[2]);
                    rule.effect = ruleMatch[3];
                }
            }

            // Parse WHEN section
            if (trimmed === 'WHEN') {
                inWhen = true;
                inThen = false;
                continue;
            }

            // Parse THEN section
            if (trimmed === 'THEN') {
                inWhen = false;
                inThen = true;
                continue;
            }

            // Parse END
            if (trimmed === 'END') {
                inWhen = false;
                inThen = false;
            }

            // Extract conditions
            if (inWhen && trimmed && !trimmed.startsWith('#')) {
                rule.conditions.push(trimmed);
            }

            // Extract actions
            if (inThen && trimmed && !trimmed.startsWith('#') && trimmed !== 'END') {
                if (trimmed.startsWith('ACTION ')) {
                    const actionText = trimmed.substring('ACTION '.length).replace(/^"/, '').replace(/"$/, '');
                    rule.description = actionText;
                } else if (trimmed.startsWith('SET ')) {
                    rule.actions.push(trimmed);
                } else if (trimmed.startsWith('FLAG ')) {
                    const flag = trimmed.substring('FLAG '.length).replace(/^"/, '').replace(/"$/, '');
                    rule.flags.push(flag);
                }
            }
        }

        // Only return rule if it has an ID
        return rule.id ? rule : null;
    }

    /**
     * Format rule for display
     * @param {Object} rule - Parsed rule object
     * @returns {string} Formatted rule text
     */
    static formatRule(rule) {
        let formatted = '';

        if (rule.id) {
            formatted += `Rule ID: ${rule.id}\n`;
        }
        if (rule.name) {
            formatted += `Name: ${rule.name}\n`;
        }
        if (rule.priority) {
            formatted += `Priority: ${rule.priority}\n`;
        }
        if (rule.effect) {
            formatted += `Effect: ${rule.effect}\n`;
        }
        if (rule.description) {
            formatted += `\nDescription: ${rule.description}\n`;
        }

        if (rule.conditions.length > 0) {
            formatted += `\nConditions:\n`;
            rule.conditions.forEach(cond => {
                formatted += `  - ${cond}\n`;
            });
        }

        if (rule.actions.length > 0) {
            formatted += `\nActions:\n`;
            rule.actions.forEach(action => {
                formatted += `  - ${action}\n`;
            });
        }

        if (rule.flags.length > 0) {
            formatted += `\nFlags: ${rule.flags.join(', ')}\n`;
        }

        if (rule.comments.length > 0) {
            formatted += `\nComments:\n`;
            rule.comments.forEach(comment => {
                formatted += `  ${comment}\n`;
            });
        }

        return formatted;
    }

    /**
     * Get rule summary statistics
     * @param {Array<Object>} rules - Array of parsed rules
     * @returns {Object} Statistics
     */
    static getRuleStats(rules) {
        const stats = {
            total: rules.length,
            byEffect: {},
            byPriority: {},
            withFlags: 0,
            avgConditions: 0,
            avgActions: 0
        };

        let totalConditions = 0;
        let totalActions = 0;

        rules.forEach(rule => {
            // Count by effect
            if (rule.effect) {
                stats.byEffect[rule.effect] = (stats.byEffect[rule.effect] || 0) + 1;
            }

            // Count by priority range
            if (rule.priority) {
                const range = Math.floor(rule.priority / 50) * 50;
                const key = `${range}-${range + 49}`;
                stats.byPriority[key] = (stats.byPriority[key] || 0) + 1;
            }

            // Count flags
            if (rule.flags.length > 0) {
                stats.withFlags++;
            }

            totalConditions += rule.conditions.length;
            totalActions += rule.actions.length;
        });

        stats.avgConditions = rules.length > 0 ? (totalConditions / rules.length).toFixed(1) : 0;
        stats.avgActions = rules.length > 0 ? (totalActions / rules.length).toFixed(1) : 0;

        return stats;
    }
}

export default RuleParser;

// Made with Bob