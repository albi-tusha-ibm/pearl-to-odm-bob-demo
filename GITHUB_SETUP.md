# GitHub Setup Instructions

This guide will help you push the `perl-to-odm-bob-demo` repository to GitHub.

## Prerequisites

- Git installed and configured on your system
- A GitHub account
- Git configured with your credentials:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```

## Step 1: Create a New GitHub Repository

1. **Go to GitHub:**
   - Navigate to [https://github.com/new](https://github.com/new)
   - Or click the "+" icon in the top-right corner and select "New repository"

2. **Configure Repository Settings:**
   - **Repository name:** `perl-to-odm-bob-demo`
   - **Description:** `MGIC PERL to IBM ODM Modernization Demo - Legacy rules migration powered by IBM Bob`
   - **Visibility:** Choose Public or Private based on your needs
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Click "Create repository"**

## Step 2: Add GitHub Remote

After creating the repository, GitHub will show you setup instructions. Use the following commands:

```bash
# Navigate to your project directory
cd perl-to-odm-bob-demo

# Add the GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/perl-to-odm-bob-demo.git

# Verify the remote was added
git remote -v
```

**Alternative: Using SSH (Recommended for frequent pushes)**
```bash
git remote add origin git@github.com:YOUR_USERNAME/perl-to-odm-bob-demo.git
```

## Step 3: Push to GitHub

```bash
# Push the main branch to GitHub
git push -u origin main

# The -u flag sets up tracking, so future pushes can be done with just: git push
```

## Step 4: Configure Repository Settings on GitHub

After pushing, configure your repository on GitHub:

### 4.1 Add Repository Description and Topics

1. Go to your repository on GitHub
2. Click the ⚙️ (gear icon) next to "About"
3. Add description:
   ```
   MGIC PERL to IBM ODM Modernization Demo - Legacy rules migration powered by IBM Bob
   ```
4. Add topics (tags):
   - `ibm-odm`
   - `rules-modernization`
   - `legacy-migration`
   - `decision-management`
   - `perl-dsl`
   - `mortgage-insurance`
   - `ai-assisted-migration`
   - `ibm-bob`
   - `business-rules`
   - `demo`

### 4.2 Enable GitHub Pages (Optional)

If you want to host documentation:

1. Go to **Settings** → **Pages**
2. Under "Source", select **main** branch
3. Select **/ (root)** or **/docs** folder
4. Click **Save**

### 4.3 Configure Branch Protection (Recommended)

For production repositories:

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

## Step 5: Verify the Push

1. **Check the repository on GitHub:**
   - Navigate to `https://github.com/YOUR_USERNAME/perl-to-odm-bob-demo`
   - Verify all files are present
   - Check that the README.md displays correctly

2. **Verify the commit:**
   ```bash
   git log --oneline -5
   ```
   You should see your recent commit: "Rename project from PEARL to PERL for consistency"

## Repository Structure on GitHub

After pushing, your repository should contain:

```
perl-to-odm-bob-demo/
├── .bob/                          # Bob AI workflow artifacts
├── .gitignore                     # Git ignore rules
├── CONTRIBUTING.md                # Contribution guidelines
├── GITHUB_SETUP.md               # This file
├── LICENSE                        # MIT License
├── README.md                      # Main documentation
├── legacy_perl/                   # Legacy PERL-DSL rules
│   ├── rules/                     # 5 .perl rule files
│   ├── samples/                   # 60 loan test cases
│   └── tables/                    # Lookup tables
├── odm_target/                    # IBM ODM target design
│   ├── design/                    # 6 design documents
│   └── export/                    # Export structure
└── tools/                         # Python utilities
    ├── parity_check.py
    └── invoke_odm_stub.py
```

## Common Issues and Solutions

### Issue: Remote already exists
```bash
# Remove the existing remote and add the correct one
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/perl-to-odm-bob-demo.git
```

### Issue: Authentication failed
```bash
# For HTTPS: Use a Personal Access Token instead of password
# Generate token at: https://github.com/settings/tokens

# For SSH: Set up SSH keys
ssh-keygen -t ed25519 -C "your.email@example.com"
# Add the public key to GitHub: https://github.com/settings/keys
```

### Issue: Push rejected (non-fast-forward)
```bash
# If the remote has changes you don't have locally
git pull origin main --rebase
git push origin main
```

## Next Steps

After successfully pushing to GitHub:

1. **Update the README.md clone URL:**
   - Edit the Quick Start section in README.md
   - Replace `<repository-url>` with your actual GitHub URL
   - Commit and push the change

2. **Share the repository:**
   - Send the GitHub URL to stakeholders
   - Add collaborators if needed (Settings → Collaborators)

3. **Set up CI/CD (Optional):**
   - Add GitHub Actions for automated testing
   - Example: Run `parity_check.py` on every push

4. **Create releases:**
   - Tag important versions: `git tag -a v1.0.0 -m "Initial release"`
   - Push tags: `git push origin --tags`
   - Create releases on GitHub with release notes

## Useful Git Commands

```bash
# Check repository status
git status

# View commit history
git log --oneline --graph --all

# Create a new branch
git checkout -b feature/new-feature

# Push a new branch to GitHub
git push -u origin feature/new-feature

# Pull latest changes
git pull origin main

# View differences
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View remote information
git remote show origin
```

## Support

For issues with:
- **Git/GitHub:** See [GitHub Docs](https://docs.github.com)
- **This project:** Create an issue on the GitHub repository
- **IBM ODM:** Refer to IBM ODM documentation

---

**Repository URL Format:**
- HTTPS: `https://github.com/YOUR_USERNAME/perl-to-odm-bob-demo.git`
- SSH: `git@github.com:YOUR_USERNAME/perl-to-odm-bob-demo.git`

**Remember to replace `YOUR_USERNAME` with your actual GitHub username!**