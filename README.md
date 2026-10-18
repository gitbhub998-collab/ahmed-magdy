# Ahmed Magdy Salah — Portfolio

A responsive portfolio for Ahmed Magdy Salah, a fourth-year Railway Technology student at October 6 University of Technology in Giza, Egypt. It presents his profile, education, railway training, technical skills, languages, and two university railway projects.

## Project

- Built with plain HTML, CSS, and JavaScript.
- The loading screen tracks the actual page, portrait, railway background, and font readiness, stays visible for at least 3.5 seconds, then opens into the site.
- No build step or package installation is required.
- Static assets are stored in `assets/`.
- The site entry point is `index.html`.

## Run locally

Open `index.html` in a browser, or use the VS Code Live Server extension for a local HTTP preview.

## Publish to GitHub

1. Create an empty repository on GitHub. Do not add a README or license there; this project already has a README.
2. From this project folder, connect the local repository and push the `main` branch:

   ```bash
   git remote add origin https://github.com/USERNAME/REPOSITORY.git
   git add .
   git commit -m "Prepare portfolio for GitHub Pages"
   git push -u origin main
   ```

   Replace `USERNAME/REPOSITORY` with the new GitHub repository path.
3. In GitHub, open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/(root)`, then save.
4. When the deployment finishes, GitHub Pages shows the published site URL in the Pages settings.

This is a static site, so no GitHub Actions workflow, build command, or dependency installation is needed. Keep the `assets/` directory and its subdirectories in the repository because the page references those files.

## Deploy to Vercel

Import the repository into Vercel using the **Other** framework preset. Leave the build command empty and set the output directory to `.`. The included `vercel.json` contains these settings.
