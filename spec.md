Working title: The waiting game

This project is a fun browser based game that integrates with claude code cli

The claude code cli is a terminal cli that developers use to write code with an ai agent.

Claude code has lifecycle hooks that we will tap into.

This project will have two parts:

1. The "local part" running on the end users machine. This taps into claude code hooks, creates a local server, and broadcasts the state of claude code to the game.
2. The "game", this will be hosted on a website in production. It gets opened by the claude hooks. It polls the local part to get the status of claude code. when claude finishes working the game pauses and prompts the user.

Mechanics:

- The local part hooks into claude code hooks.
- The local part will get installed by users using something like `npx waiting-game setup`
- this command will install the proper scripts and connect to the claude hooks.
- Optional mechanic: use query params to initialize the game on launch, for example, telling it what the localhsot server port is

Our Lifecycle (MVP):

- Startup
  - starts local server
  - launches 'game' using url
- Gaming:
  - claude is working without issue, the user is gaming
  - the game polls the local part to check claudes status.
- Stop
  - claude is done working, game pauses
