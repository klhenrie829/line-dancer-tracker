# Line Dance Tracker

A local-first web app for tracking line dances, songs, counts, tags, restarts, difficulty, and personal progress.

## Use it

Open `index.html` in a browser, or serve the folder locally:

```sh
python3 -m http.server 5173
```

Then visit `http://localhost:5173`.

## Phone install

This is a progressive web app. Once it is served from a local or hosted web address, you can add it to your phone's home screen.

- iPhone: open the app in Safari, tap Share, then tap **Add to Home Screen**.
- Android: open the app in Chrome, tap the menu, then tap **Install app** or **Add to Home screen**.

## Publish with GitHub Pages

1. Create a new GitHub repository.
2. Upload every file in this folder to the repository.
3. In the repository, open **Settings** > **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose the `main` branch and the root folder, then save.
6. Open the published GitHub Pages URL on your phone.

## Data

The app saves dances in browser `localStorage`. Use **Export JSON** to keep a backup and **Import JSON** to restore or move your library to another browser.
