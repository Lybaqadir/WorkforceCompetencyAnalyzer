# TeamLens

An AI-powered workforce planning tool. It has two parts that run at the same time:

- **Frontend** — the website you see in the browser.
- **Backend** — the AI brain that answers the chat and does the analysis.

You need to start both. Follow the steps below in order.

---

## Step 1 — Install Node.js (one time only)

1. Go to **https://nodejs.org**
2. Download the **LTS** version and install it (just click Next until it finishes).
3. Done — you won't need to do this again.

## Step 2 — Add the AI key (one time only)

1. Open the `server` folder.
2. Make a copy of the file called **`.env.example`** and rename the copy to **`.env`**.
3. Open that new `.env` file in Notepad and paste in your AI keys where it says `your-...`.
4. Save and close it.

> Don't have the keys? Ask whoever set up the project for them.

## Step 3 — Start the AI brain (backend)

1. Open the **`server`** folder.
2. In the address bar at the top, type **`cmd`** and press Enter (this opens a black command window in that folder).
3. Type this and press Enter:
   ```
   npm install
   ```
   *(only needed the first time — wait for it to finish)*
4. Then type this and press Enter:
   ```
   npm start
   ```
5. Leave this window open. You should see: `TeamLens server running...`

## Step 4 — Start the website (frontend)

1. Open the **main project folder** (the one that contains this README).
2. Type **`cmd`** in the address bar and press Enter to open a second command window.
3. Type this and press Enter:
   ```
   npm install
   ```
   *(only needed the first time)*
4. Then type this and press Enter:
   ```
   npm run dev
   ```
5. It will show a link like **`http://localhost:5173`**.

## Step 5 — Open it

Hold **Ctrl** and click the `http://localhost:5173` link, or type it into your web browser.

That's it — TeamLens is running. 🎉

---

## Next time (after the first setup)

You only need to run **`npm start`** (in the `server` folder) and **`npm run dev`** (in the main folder). No need to install again.

## To stop it

Close both command windows, or click inside them and press **Ctrl + C**.

## If something doesn't work

- **The chat gives errors** → check the `server` window is still open and your `.env` keys are correct.
- **The page won't load** → make sure both command windows are running.
- **A different port number appears** (like 5174) → that's fine, just use whatever link it shows.
