import kaplay from "kaplay";
import "kaplay/global";

// Initialize Kaplay
kaplay({
    global: true,
    fullscreen: true,
    scale: 1,
    debug: true,
    background: [0, 105, 148, 1], // Light blue background
});

// Load assets
loadSprite("rowboat", "sprites/rowboat.png");

// Constants for wind effect
const windSpeed = 100;
const windCount = 100; // Number of wind lines
const windLength = 30; // Length of each wind line
let windAngle = 45; // Initial wind direction (Northeast)
const windChangeInterval = 5; // Change wind direction every 5 seconds

// Sail rotation limits (angles in degrees)
const minSailAngle = -45; // Left limit
const maxSailAngle = 45; // Right limit

// Create wind lines
const windLines = [];
for (let i = 0; i < windCount; i++) {
    windLines.push({
        pos: vec2(rand(0, width()), rand(0, height())),
        speed: rand(windSpeed * 0.8, windSpeed * 1.2), // Slight variation in speed
        angle: windAngle, // Initial angle for wind
    });
}

// Create the sailboat using the rowboat sprite
const sailboat = add([
    sprite("rowboat"),
    pos(width() / 2, height() /2),
    anchor("center"),
    rotate(0),
    {
        speed: 200,
        windEffect: 0,
        sailAngle: 0, // Initial angle of the sail relative to the boat
        reverse: false, // Whether the boat is moving in reverse direction
    },
]);

// Create the sail as a separate object
const sail = add([
    rect(10, 50), // Width and height of the sail
    pos(sailboat.pos.x, sailboat.pos.y - 25), // Position the sail on top of the sailboat
    anchor("center"),
    color(255, 255, 255), // White sail
    rotate(sailboat.sailAngle),
]);

// Update the sail position and rotation relative to the sailboat
function updateSail() {
    sail.pos = sailboat.pos.add(rotateVector(vec2(0, -25), sailboat.sailAngle)); // Adjust position
    sail.angle = sailboat.sailAngle; // Adjust rotation
}

// Update wind lines
function updateWindLines() {
    windLines.forEach(wind => {
        const direction = rotateVector(vec2(1, 0), wind.angle);
        wind.pos = wind.pos.add(direction.scale(wind.speed * dt()));

        // Reset position if out of bounds
        if (wind.pos.x > width() || wind.pos.y > height()) {
            wind.pos = vec2(rand(0, width()), -windLength);
        }
    });
}

// Draw wind lines
function drawWindLines() {
    windLines.forEach(wind => {
        const direction = rotateVector(vec2(1, 0), wind.angle);
        const endPos = wind.pos.add(direction.scale(windLength));

        drawLine({
            p1: wind.pos,
            p2: endPos,
            width: 2,
            color: rgb(255, 255, 255), // White wind lines
        });
    });
}

// Calculate rotated vector
function rotateVector(vector, angle) {
    const rad = deg2rad(angle);
    const x = vector.x * Math.cos(rad) - vector.y * Math.sin(rad);
    const y = vector.x * Math.sin(rad) + vector.y * Math.cos(rad);
    return vec2(x, y);
}

// Apply wind effect to the sailboat based on sail position
function applyWindToSailboat() {
    const windDirection = rotateVector(vec2(1, 0), windAngle); // Wind direction changes
    const sailDirection = rotateVector(vec2(0, -1), sailboat.sailAngle); // Sail direction

    // Calculate the angle between the wind direction and sail direction
    const angleBetween = Math.abs(windDirection.angle() - sailDirection.angle());

    // Apply force based on how perpendicular the wind is to the sail
    const windForce = Math.cos(deg2rad(90 - angleBetween)) * 100; // Force is strongest when the sail is perpendicular to the wind
    let appliedForce = .1*100*Math.sqrt(windSpeed)*Math.cos(toRadians(Math.abs(sailboat.sailAngle-windAngle))); // Apply wind force in sail direction

    // Reverse direction if tacking
    if (sailboat.reverse) {
        appliedForce = appliedForce.scale(-1); // Reverse the direction of the applied force
    }

    sailboat.windEffect = appliedForce;
    sailboat.move(sailboat.windEffect*Math.cos(toRadians(sailboat.angle-90)),sailboat.windEffect*Math.sin(toRadians(sailboat.angle-90)));
}

// Handle input for sail adjustment
onKeyDown("a", () => {
    // Rotate sail counter-clockwise, but limit to minSailAngle
    sailboat.sailAngle = Math.max(sailboat.sailAngle - 2, minSailAngle);
    updateSail(); // Update sail position and rotation
});

onKeyDown("d", () => {
    // Rotate sail clockwise, but limit to maxSailAngle
    sailboat.sailAngle = Math.min(sailboat.sailAngle + 2, maxSailAngle);
    updateSail(); // Update sail position and rotation
});

// Handle input for tacking (reversing direction)
onKeyDown("space", () => {
    sailboat.reverse = !sailboat.reverse; // Toggle reverse state
});

// Handle input for left and right movement
onKeyDown("left", () => {
    sailboat.angle -= 2;
});

onKeyDown("right", () => {
    sailboat.angle += 2;
});

// Keep the sailboat within the bounds of the screen
sailboat.onUpdate(() => {
    applyWindToSailboat();

    if (sailboat.pos.x < 0) sailboat.pos.x = 0;
    if (sailboat.pos.x > width()) sailboat.pos.x = width();
    if (sailboat.pos.y < 0) sailboat.pos.y = 0;
    if (sailboat.pos.y > height()) sailboat.pos.y = height();
});
//function to convert degrees to radians
function toRadians(angleInDegrees){
    return(angleInDegrees*Math.PI/180);
 }



// Function to change the wind direction periodically
function changeWindDirection() {
    windAngle = rand(-90, 90); // Randomly change wind direction between -90 and 90 degrees

    // Update the wind lines to match the new wind direction
    windLines.forEach(wind => {
        wind.angle = windAngle;
    });
}

// Set interval to change the wind direction
loop(windChangeInterval, () => {
    changeWindDirection();
});

// Main update loop
onUpdate(() => {
    updateWindLines();
    updateSail(); // Continuously update the sail position and rotation
    applyWindToSailboat(); // Continuously apply wind effect to the sailboat
});

// Main draw loop
onDraw(() => {
    drawWindLines();
});
