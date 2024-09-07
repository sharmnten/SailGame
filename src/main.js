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
loadSprite("sailboat","sprites/pixil-frame-0.png");
loadSprite("bouy","sprites/bouy.png");

// Constants for wind effect
const windSpeed = 100;
const windCount = 100; // Number of wind lines
const windLength = 30; // Length of each wind line
let windAngle = 45; // Initial wind direction (Northeast)
const windChangeInterval = 5; // Change wind direction every 5 seconds
// Minimap properties
const minimapScale = 0.2; // Scale down the minimap to 20% of the full map size
const minimapSize = vec2(width() * minimapScale, height() * minimapScale); // Minimap size


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

add([
    sprite("bouy"),
    area(),
    body({isStatic:true}),
    pos(Math.random()*width(),Math.random()*height()),
    scale(.05,.05)
])



add([
    sprite("bouy"),
    body({isStatic:true}),
    area(),
    pos(Math.random()*width(),Math.random()*height()),
    scale(.05,.05)
])


add([
    sprite("bouy"),
    area(),
    body({isStatic:true}),
    pos(Math.random()*width(),Math.random()*height()),
    scale(.05,.05)
])






// Create the sailboat using the rowboat sprite
const sailboat = add([
    sprite("sailboat"),
    pos(width() / 2, height() / 2),
    anchor("center"),
    area(),
    body(),
    scale(6, 6),
    health(3),
    rotate(0),
    {
        speed: 200,
        windEffect: 0,
        sailAngle: 0, // Initial angle of the sail relative to the boat
        reverse: false, // Whether the boat is moving in reverse direction
    },
]);

// Create the sail as a separate object, anchored to the bottom so it rotates from that point
const sail = add([
    rect(10, 50), // Width and height of the sail
    pos(sailboat.pos.x, sailboat.pos.y), // Position the sail initially at the same location as the boat
    anchor("bot"), // Anchor to the bottom of the sail so it rotates from its base
    color(255, 255, 255), // White sail
    rotate(sailboat.sailAngle),
]);

// Update the sail position and rotation relative to the sailboat
function updateSail() {
    // Offset to position the sail in front of the boat
    const sailOffset = rotateVector(vec2(0, -10), sailboat.angle); // 40 units in front of the boat

    // Update sail position and rotation to always be offset from the boat's center
    sail.pos = sailboat.pos.add(sailOffset);

    // Set the sail's angle relative to the boat's angle
    sail.angle = sailboat.angle + sailboat.sailAngle;
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

// Draw the minimap in the corner
function drawMinimap() {
    // Draw a rectangle representing the minimap background
    drawRect({
        fixed:true,
        pos: vec2(10, 10), // Top-left corner of the screen
        width: minimapSize.x,
        height: minimapSize.y,
        color: rgb(0, 0, 0, 0.5), // Semi-transparent background
    });

    // Draw the sailboat's position on the minimap
    const minimapBoatPos = sailboat.pos.scale(minimapScale);

    drawRect({
        fixed:true,
        pos: vec2(10, 10).add(minimapBoatPos), // Position in the minimap
        width: 5, // Small rectangle to represent the boat
        height: 5,
        color: rgb(255, 255, 255), // White color for the boat marker
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
// Apply wind effect to the sailboat based on sail position
function applyWindToSailboat() {
    const windDirection = rotateVector(vec2(1, 0), windAngle); // Wind direction
    const sailDirection = rotateVector(vec2(0, -1), sailboat.sailAngle); // Sail direction

    // Calculate the angle between the wind direction and sail direction
    const angleBetween = Math.abs(windDirection.angle() - sailDirection.angle());

    // Force is strongest when the sail is perpendicular to the wind (90 degrees)
    const windForce = Math.cos(deg2rad(90 - angleBetween)) * 100;

    // Adjust applied force based on sail and wind angles
    let appliedForce = 0.1 * 100 * Math.sqrt(windSpeed) * Math.cos(toRadians(Math.abs(sailboat.sailAngle - windAngle)));

    // Determine if the wind is pushing the boat forward or backward
    const relativeWindAngle = sailboat.angle - windAngle;

    if (relativeWindAngle > -90 && relativeWindAngle < 90) {
        // Wind is mostly in front of the boat (favorable for forward movement)
        sailboat.reverse = false;
    } else {
        // Wind is mostly behind the boat, might push it backward
        appliedForce = -Math.abs(appliedForce);
        sailboat.reverse = true;
    }

    // Reverse direction if tacking
    if (sailboat.reverse) {
        appliedForce = -Math.abs(appliedForce); // Move backward if reverse is active
    } else {
        appliedForce = Math.abs(appliedForce); // Move forward if reverse is inactive
    }

    sailboat.windEffect = appliedForce;

    // Move the boat based on the wind effect and its angle
    sailboat.move(
        sailboat.windEffect * Math.cos(toRadians(sailboat.angle - 90)),
        sailboat.windEffect * Math.sin(toRadians(sailboat.angle - 90))
    );
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

// Add speedometer
onDraw(() => {
    drawText({
        text: Math.abs(Math.round(sailboat.windEffect) / 10) + " knots",
        pos: vec2(width() - 200, height() - 25),
        anchor: "center",
        color: rgb(255, 255, 255),
    });
});



// camera follows player and restricts movement within minimap bounds
sailboat.onUpdate(() => {
    camPos(sailboat.pos);

    // Calculate the map bounds based on minimap size and scale
    const mapBounds = {
        left: 0,
        right: width(),
        top: 0,
        bottom: height(),
    };

    // Restrict sailboat movement within the minimap bounds
    if (sailboat.pos.x < mapBounds.left) {
        sailboat.pos.x = mapBounds.left;
    }
    if (sailboat.pos.x > mapBounds.right) {
        sailboat.pos.x = mapBounds.right;
    }
    if (sailboat.pos.y < mapBounds.top) {
        sailboat.pos.y = mapBounds.top;
    }
    if (sailboat.pos.y > mapBounds.bottom) {
        sailboat.pos.y = mapBounds.bottom;
    }
});

// Function to convert degrees to radians
function toRadians(angleInDegrees) {
    return (angleInDegrees * Math.PI) / 180;
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

onDraw(() => {
    drawWindLines();
    drawMinimap(); // Draw the minimap on each frame
});

