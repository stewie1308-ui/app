# Inkling — micro-learning app for Android (design)

## Intent
A personal Android app for learning cool, interesting things in a few minutes a day. You don't pick a subject up front: the app serves a mix of science & space, history & oddities, how things work, and words & ideas. It must run as a real app on the phone, fully offline, with no website involved.

## Goals
- Short daily session: ~5 cards, each followed by a one-tap quiz question and a one-line "why".
- Things you get wrong come back later (spaced repetition), so facts actually stick.
- Daily streak and simple stats (cards learned, accuracy).
- "Just browse" mode: swipe through cards by topic with no quiz.
- Works with no internet. The only thing that ever goes online is the optional "Get more cards" button. Progress is saved on the phone.
- Installs as a normal Android app with its own icon; updates install over the top without losing progress.

## Non-goals (v1)
- Play Store listing, accounts, cloud sync, AI-generated content, ads, notifications.

## Anti-goals
- Walls of text (cards stay under ~60 words).
- Guilt-trip streak mechanics.
- Wrong or myth-based "facts". Every card must be accurate.

## Approaches considered
1. **Real Android app built on GitHub (chosen).** Own icon, full screen, offline. Google's Android build tools can't be downloaded in Claude's workspace, so GitHub Actions on the user's account builds the APK and attaches it to a GitHub Release for download on the phone.
2. Installable web app (PWA). App-like, but it starts from a website, which the user doesn't want.
3. A single offline HTML file. No hosting, but it always opens in the browser, so it's clunky.

## Decided by the user
- Android phone; all four topic areas; content built in and offline; option 1 for delivery.
- Session style: the user asked for a recommendation and Claude recommended "daily cards + quiz + spaced repetition + browse mode". **Claude's call, awaiting approval.**

## Claude's calls (correct any)
- **Name:** "Inkling" (chosen by Claude after the user asked for something other than Spark). Repo: `stewie1308-ui/app` (public, created by the user).
- **Tech:** plain HTML/CSS/JS wrapped with Capacitor into a native Android app. No framework, so it stays small and fast.
- **Content:** about 400 cards to start (100 per topic). They are written in Claude's own words from openly licensed sources (Wikipedia, OpenStax textbooks, NASA and other public-domain material), and each card links to its source. Raw book text isn't used: it's too long for a card and has no quiz. Each card has a topic, a title, a short body, a question with 3–4 options, the answer, a one-line explanation and a source. The starter set ships inside the app.
- **More content (card packs):** a "Get more cards" button downloads new packs (JSON files in the repo's `packs/` folder) whenever the phone has signal. Once downloaded, a pack works offline forever. New packs can be added to the repo at any time, with no app update needed. Wikipedia-derived text is CC BY-SA, so packs carry attribution and the same licence.
- **Spaced repetition:** Leitner-style. A wrong answer brings the card back tomorrow. A right answer pushes it out further each time: 1 → 3 → 7 → 16 → 35 days, then it counts as mastered. A daily session puts due reviews first, then fills up to 5 cards with new ones.
- **Screens:** Home (streak, start today's session, browse, stats), Session (card → question → feedback), Session complete, Browse (filter by topic, swipe), Settings (cards per session 3/5/10, reset progress).
- **Look:** dark, bold and playful, with a colour per topic. Large tap targets, designed for one-handed use.
- **Storage:** on-device (WebView localStorage). Nothing leaves the phone.
- **Build & delivery:** the public GitHub repo `stewie1308-ui/app`, public so the APK downloads on the phone without signing in. On every push, Actions builds a signed release APK and publishes it as the "latest" Release. A fixed signing key is stored as a repo secret so updates install over the top.
- **Install:** open the Release link on the phone, download `Inkling.apk`, allow "install unknown apps" for the browser once, then install.

## Research-driven changes (22 Nov 2026)
- **Guess first:** each card opens with a question before the fact is revealed (the pretesting effect plus the curiosity gap). The user picks an answer and taps "I'm sure" or "Just guessing". The reveal comes straight away with a short "why" (immediate feedback).
- **Confident misses** are flagged ("you were sure!") and scheduled to come back sooner. The hypercorrection effect means these are learned well, but they can also return.
- **Reviews ask differently:** a review asks about the same fact in a different form, so it can't be answered from pattern memory alone.
- **Pictures must explain:** a picture appears only when it helps explain (a timeline, a scale comparison, a diagram). No decorative animations, because seductive details hurt learning.
- **Gentle streak:** one card a day keeps it going. Two "rest day" freezes a week happen automatically. No guilt notifications.
- **Clear endpoints, resumable:** each session ends with "done for today". Leaving mid-session resumes where you left off.
- **Rabbit-hole browse feed** (WikiTok-style), plus a "Go deeper" link to the source on every card.
- **No paywall, accounts or tracking:** these were the top complaints across Blinkist, Headway, Imprint and Nibble.
- **Look: Paper & Ink (chosen by the user).** Warm cream paper background, an editorial serif for headlines with a clean sans-serif for body text, and ink line illustrations that explain. Muted topic colours: sage for Science & Space, terracotta for History & Oddities, ochre for How Things Work, slate blue for Words & Ideas. Calm and bookish. This replaces the earlier "dark, bold" call.

## Left to the builder
Exact card copy (it must be fact-checked), the visual details, the icon design and the animation polish.
