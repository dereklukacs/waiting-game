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
