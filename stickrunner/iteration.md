can you add a road for the user to run on. Have it angle so that there is a sense of perspective

Can you add obstacles to the road?

Can you make the camera move forward along the road

make the road longer, like almost endless

can you programmatically generate the obstacles as we go forward on the road?

can you allow the mouse to drag the green cube left and right, but only within the bounds of the road. Make a max movement speed

instead of obstacles, can you place gates. the gates should be either red or blue. blue gates are positive and red gates are negative. going through a blue gate will add a cube. going through the red gate will remove a cube.

can you have the gates be aligned with the left and right sides of the road? THere should always be 2 gates, the user has to choose which one to take.

make the gates straddle the entire half of the road

can you add a counter showing how many cubes I have

it seems buggy, sometimes when I go through a blue gate I get plus 2. Sometimes nothing happens. Sometimes when I go through red I get plus2. Sometimes minus 2.

please draw edges on the cubes, have them all spin the same way, and instead of lining them, clump them together using an "attraction+repulsion" computation so they are close but also when they get too close they push apart

The additional cubes seem to not be attracted towards the main cube. It is also kinda janky and glitchy

it still does not seem to be following the main cube. I think what we want is a hidden "magnet point" that all cubes get attracted to. This means there is no such thing as a main cube. this point is what the mouse controls. all cubes get attracted towards this point in the same way

can you make the cubes jostle less? is this some collision thing or is the repulsion too strong?

Let's try to treat each cube as it's own logic relative to the gates, if the cubes go through the red gatae they get deleted. If they go through the blue gate they have a percentage change of duplicating

Let's add a 'force field' between the gates and remove the top bar, make the force field have the height of the poles, give is an opacity that can be seen through

I think that there may be multiple barriers spawning at each location.

I think that we need a game over and restart mechanic when the last cube gets eliminated

after restarting the barriers were REALLY far away. I think we need to do a full reset

after restarting now the barriers are correct but the first cube is not reset

can you have the center pillars of the gates be split in half? currently they are interfering and only one of the colors is rendering

let's make the cubes 30% smaller

the gates are not coming at consistent spacing, also the first spawn shows too many gates at once, we should generate them all programmatically

make the movement speed 20% faster

can you create a config.ts file centralizes all of the configurable variables and any rng values

can you replace each of the cubes with a stick person? how can I get 3d assets for that? Ideally their legs would move to simulate running

Can you reduce hitbox size for the stick person? they are getting too spread out

Can we add zombies coming towards the stick people. If one of the stick people touches a zombie that stick person is removed

improve the look of the stick figure, ideally we should have 3d structures and proper shadows and illumination so we can better differentiate the characters

the scene is too dark, the road and figures are not vibrant enough

can we add a mechanic that if a stick figure is no longer on the road it falls off and gets removed. add the falling animation.

let's add a mechanic where the stick figures have guns and shoot. they should always shoot straight forward. simulate the bullets and have them hit the zombies.

add jumping, make them actually walk on the road (right now they're floating)

they're too low now and the bullets aren't hitting the zombies

can you not make the jumping timed, I want it tied to the spacebar.

now let's add obstacles we have to jump over

the obstacles are bit too tough and too many, can you add some constraints so that they're not too close to eachother

let's add a force start option that allows me to start the game when claude has started working but I'm waiting for a tool call.

let's add obstacles approximately 1 for every 2 sets of gates. Let's keep the obstacles centered in the two halves of the road

the obstacles should remove stick people who touch them

let's have the instructions of how to play in the lower left corner

let's stop referring to things as cubes. Let's call them challengers

I want to set a username, this should be set on first visiting the page and cached in localstorage

I want to be able to edit the username

## Multiplayer phase

I now want to make this app multiplayer.

There will be no auth.

I want to use a golang server and websockets.

First, let's create the golang server and have the game client register with it by sending it's username and just getting that back.

can you store commands in a makefile for the backend? keep it really simple and only the basics
let's deploy the backend using railway

can you show the number of online players on the frontend

let's use device id as the unique identifier for a player

let's make the obstacles 40% bigger, about 80% the width of one lane of the road

fix the ui of the name field while editing, make the text white so theres enough contrast

Let's add a score bsaed on number of zombies killed

Let's add a live leaderboard that is syncrhonized to the backend (how about every 500 ms?) that shows up to the top 5 scores from active players.

Let's have a second leaderboard that shows all time high scores

let's make the zombies increase in number over time, let's also have their health increase

let's make it so that control of the mob is just done with mouse move, not drag. And make clicking the shooting action instead of auto shoot

the zombies are still too easy. make them increase in numbers faster

the mousemove range is too big, let's reduce the width of the dynamic range and have a deadzone on the outside. Let's say 25% on either side is a deadzone

let's go back to dragging for controlling the movement and having autoshoot

the game difficulty needs to reset when the game resets, not based on the amount of time one page

The game speed is inconsistent across devices. We need to unify it so it matches clock speed, not just frame rate

let's have the difficulty get harder linearly instead of step change

can you make the game speed over time too

a minute is too long of a time period for a progression, let's make it every 20 seconds

let's have a central "level" that sets the overall difficulty

Let's have the "claude idle" screen say the current score and say something like "Claude code is done working, to play for longer give it a better prompt" then instead of pausing, on pressing play again it triggers a restart

let's keep the force play button, but only for localhost / dev

let's add a death animation to the stick figures, let's have them turn red and fall over in 500 ms

can you add some randomness to the death animation? different hues and timing and fall angles?

Let's make the gates more interesting. Can you start by nicely refactoring the code so that the gates can be replaced with different types of gates? We should have some logic for picking what gates to use and then some nicely modular logic surrounding how to render the gate, hit detect, etc

the death animation is playing for figures that are falling, don't play that, just play the fall animation

the death animation is no longer playing on the red gates. also these figures are not getting removed from the scene so on the next play through they are still there

the road and stars run out after a bit, let's procedurally generate it in front (and remove the assets behind the camera)

please confirm that the zombies and gates are being removed after they scroll out of the view behind

Let's add a weapons upgrade system that controls the guns. To start with let's have these parameters: weapon damage, bullet velocity, and rate of fire

The weapon upgrades should be purchased in an upgrade purchase menu. This is accessed from the death screen.

To purchase weapon upgrades, collect coins. The coins are dropped by zombies. Each zombie killed has a percentage change of dropping a coin.

Coins and weapon upgrades should persist between games in local storage

I think the left to right rate limit should increase slightly as the difficulty increases

On first load, show instructions for how to run the claude code integration `npx waiting-game@latest setup` and `npx waiting-game@latest start`

add the npx commands to the bottom right of the screen

========= UNFINISHED TASKS BELOW THIS LINE =======

let's make sure the local server handles pre-compact commands
