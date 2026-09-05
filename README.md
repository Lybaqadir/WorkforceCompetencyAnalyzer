# TeamLens

TeamLens is a workforce planning tool built around one question: for any given role or task, should it be done by a person, an AI system, or some mix of the two? It uses generative AI to map team skills, flag gaps, and generate the kind of competency and job-description work that usually eats up hours of HR time.

It was built during a digital innovation internship as an exploration of how AI can be applied to workforce strategy — not as a polished product, but as a working prototype meant to be pushed further.

## What it actually does

- Looks at a role or task and recommends whether it should be handled by a human, automated, or split — using a build/buy/borrow/bot framework.
- Maps the skills a team currently has and where the gaps sit.
- Generates CIPD-aligned competency assessments for roles and individuals.
- Drafts job descriptions automatically from a few role inputs.
- Surfaces internal mobility options instead of defaulting to external hiring.
- Runs career gap analysis — where someone is versus where they're trying to go.
- Includes a what-if simulator so planners can test restructures or automation changes before committing to them.
- A chat interface sits on top of all of this, so you can just ask questions instead of digging through screens.

## How it's put together

Two parts run alongside each other:

- **Frontend** — the interface itself: onboarding, the "design your team" builder, dashboards, chat. Built with Vite.
- **Backend** — a Node server that handles the AI calls and the underlying analysis logic.

The frontend talks to the backend over local HTTP, and the backend calls out to whichever LLM provider is configured in its environment.

## Running it locally

**Install Node.js** (one-time) — get the LTS build from nodejs.org.

**Set up your AI keys** (one-time):
```
cd server
cp .env.example .env
```
Then open `.env` and add your keys where indicated.

**Start the backend:**
```
cd server
npm install
npm start
```
You should see `TeamLens server running...` in that terminal — leave it open.

**Start the frontend**, in a separate terminal from the project root:
```
npm install
npm run dev
```
It'll print a local address, usually `http://localhost:5173`. Open that in your browser and you're in.

After the first setup you only need `npm start` and `npm run dev` — no reinstalling. To stop everything, close the terminals or hit Ctrl+C in each.

If the chat is throwing errors, check the backend terminal is still running and the `.env` keys are correct. If the page won't load at all, confirm both processes are up. If it starts on a different port than 5173, that's fine — just use whatever it shows.

## Where this could go next

This is a prototype, so there's a fair amount left to build out:

- Real persistence — right now data doesn't survive a restart, so a proper database is the obvious next step.
- Authentication and role-based access, so HR admins, managers, and employees aren't all seeing the same view.
- Exporting assessments and job descriptions to PDF or Word instead of leaving them stuck in the app.
- Decoupling the backend from a specific LLM provider so it's not locked in.
- A dashboard that shows trends over time instead of just point-in-time snapshots.
- Some kind of check on the AI-generated competency scores and job descriptions, so biased or skewed language gets caught before it reaches anyone.
- Actual test coverage, especially around the AI-vs-human recommendation logic — that's the part doing the most judgment calls.
- Multiple people working on the same team-design session at once, which would matter a lot for workshop-style use.
- A UI pass for tablet and mobile, since a lot of the intended use is in-person workshops rather than at a desk.