# sevylevy

## SSH Key Setup

To contribute to this repository using SSH, generate an Ed25519 SSH key with the following command:

```bash
ssh-keygen -t ed25519 -C "https://github.com/Honcho92/sevylevy"
```

The `-C` flag adds a comment to the key (here the repository URL is used as the identifier).
Then add the public key to your GitHub account under **Settings → SSH and GPG keys**.

For more details, see the [GitHub SSH key documentation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).
