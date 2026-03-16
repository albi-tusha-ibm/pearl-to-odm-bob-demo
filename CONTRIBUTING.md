# Contributing to Pearl to ODM Bob Demo

Thank you for your interest in contributing to this project! This document provides guidelines for contributing to the Pearl to ODM migration demonstration project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report Issues](#how-to-report-issues)
- [How to Suggest Enhancements](#how-to-suggest-enhancements)
- [Pull Request Process](#pull-request-process)
- [Development Guidelines](#development-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

Examples of unacceptable behavior include:

- Harassment, discrimination, or offensive comments
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## How to Report Issues

If you encounter a bug or issue with the project:

1. **Check existing issues** - Search the [issue tracker](../../issues) to see if the problem has already been reported
2. **Create a detailed report** - If the issue is new, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the problem
   - Expected behavior vs. actual behavior
   - Your environment details (OS, Python version, ODM version if applicable)
   - Any relevant logs or error messages
   - Screenshots if applicable

### Issue Template

```
**Description:**
A clear description of the issue

**Steps to Reproduce:**
1. Step one
2. Step two
3. ...

**Expected Behavior:**
What you expected to happen

**Actual Behavior:**
What actually happened

**Environment:**
- OS: [e.g., macOS 13.0, Ubuntu 22.04]
- Python Version: [e.g., 3.9.7]
- ODM Version: [if applicable]

**Additional Context:**
Any other relevant information
```

## How to Suggest Enhancements

We welcome suggestions for improvements! To suggest an enhancement:

1. **Check existing suggestions** - Review open issues to see if your idea has been proposed
2. **Create an enhancement request** with:
   - A clear, descriptive title prefixed with `[Enhancement]`
   - Detailed description of the proposed feature
   - Use cases and benefits
   - Potential implementation approach (if you have ideas)
   - Any relevant examples or mockups

### Enhancement Template

```
**Enhancement Title:**
[Enhancement] Brief description

**Problem Statement:**
What problem does this solve?

**Proposed Solution:**
Describe your proposed solution

**Benefits:**
- Benefit 1
- Benefit 2

**Alternatives Considered:**
Other approaches you've thought about

**Additional Context:**
Any other relevant information
```

## Pull Request Process

### Before Submitting a Pull Request

1. **Fork the repository** and create your branch from `main`
2. **Follow coding standards** - Ensure your code follows Python PEP 8 style guidelines
3. **Test your changes** - Run existing tests and add new tests for new functionality
4. **Update documentation** - Update README.md or other docs if needed
5. **Keep commits clean** - Use clear, descriptive commit messages

### Submitting a Pull Request

1. **Create a pull request** with:
   - A clear title describing the change
   - Reference to related issues (e.g., "Fixes #123")
   - Description of changes made
   - Testing performed
   - Screenshots (if UI changes)

2. **Pull Request Checklist:**
   - [ ] Code follows project style guidelines
   - [ ] Self-review of code completed
   - [ ] Comments added for complex logic
   - [ ] Documentation updated
   - [ ] Tests added/updated and passing
   - [ ] No new warnings generated
   - [ ] Related issues referenced

3. **Review Process:**
   - Maintainers will review your PR
   - Address any feedback or requested changes
   - Once approved, a maintainer will merge your PR

### Pull Request Template

```
**Description:**
Brief description of changes

**Related Issues:**
Fixes #(issue number)

**Type of Change:**
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Other (please describe)

**Testing:**
Describe testing performed

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
```

## Development Guidelines

### Setting Up Development Environment

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment
4. Install dependencies (if any): `pip install -r requirements.txt`

### Coding Standards

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Keep functions focused and concise
- Comment complex logic

### Testing

- Write tests for new functionality
- Ensure all tests pass before submitting PR
- Aim for good test coverage

### Commit Messages

Use clear, descriptive commit messages:

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests when relevant

Example:
```
Add security notice to ODM stub script

- Add warning comment about demo credentials
- Recommend environment variables for production
- Fixes #123
```

## Questions?

If you have questions about contributing, feel free to:

- Open an issue with the `[Question]` prefix
- Reach out to the maintainers

Thank you for contributing to this project!