import kaplay from "kaplay";
import "kaplay/global";
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ijjitnoroazbwxsqwtyf.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqaml0bm9yb2F6Ynd4c3F3dHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU3NDM2NTMsImV4cCI6MjA0MTMxOTY1M30._CPjSuTYWh_C_NBWdoXWHi0xpdwGJGYP4Np8bHjaIVI'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

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
loadSprite("sailboat", "sprites/pixil-frame-0.png");
loadSprite("bouy", "sprites/bouy.png");
loadSprite("wave", "sprites/wave.png");

// Constants for wind effect
let windSpeed = 100;
const windCount = 200;
const windLength = windSpeed / 4;
let windAngle = 45;
const windChangeInterval = 60;

// Minimap properties
const minimapScale = 0.2;
const minimapSize = vec2(width() * minimapScale, height() * minimapScale);

// Sail rotation limits
const minSailAngle = 90;
const maxSailAngle = 270;

// Create wind lines
const windLines = [];
for (let i = 0; i < windCount; i++) {
    windLines.push({
        pos: vec2(rand(0, width()), rand(0, height())),
        speed: rand(windSpeed * 0.8, windSpeed * 1.2),
        angle: windAngle,
    });
}

// Add static bouys
for (let i = 0; i < 3; i++) {
    add([
        sprite("bouy"),
        area(),
        body({ isStatic: true }),
        pos(Math.random() * width(), Math.random() * height()),
        scale(0.05, 0.05),
    ]);
}

// Add waves periodically
loop(0.5, () => {
    const wave = add([
        sprite("wave"),
        area(),
        pos(Math.random() * width(), Math.random() * height()),
        offscreen({ hide: true }),
        scale(5, 5),
    ]);
    wave.move(0.5 * windSpeed * Math.cos(toRadians(windAngle)), 0.5 * windSpeed * Math.sin(toRadians(windAngle)));
    wait(3, () => {
        destroy(wave);
    });
});

// Function to generate a unique ID for each player
function generatePlayerId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Player's unique ID
const playerId = generatePlayerId();

// Initialize player state
const playerState = {
    id: playerId,
    pos: { x: width() / 2, y: height() / 2 },
    angle: 0,
    sailAngle: 0,
};

// Store other players
const otherPlayers = {};

// Create the sailboat
const sailboat = add([
    sprite("sailboat"),
    pos(playerState.pos.x, playerState.pos.y),
    anchor("center"),
    area(),
    body(),
    scale(6, 6),
    health(3),
    rotate(playerState.angle),
    {
        speed: 200,
        windEffect: 0,
        sailAngle: playerState.sailAngle,
        reverse: false,
    },
]);

// Create the sail
const sail = add([
    rect(10, 50),
    pos(sailboat.pos.x, sailboat.pos.y),
    anchor("bot"),
    color(255, 255, 255),
    rotate(sailboat.sailAngle),
]);

// Update the sail position and rotation
function updateSail() {
    const sailOffset = rotateVector(vec2(0, -10), sailboat.angle);
    sail.pos = sailboat.pos.add(sailOffset);
    sail.angle = sailboat.angle + sailboat.sailAngle;
}

// Update wind lines
function updateWindLines() {
    windLines.forEach(wind => {
        const direction = rotateVector(vec2(1, 0), wind.angle);
        wind.pos = wind.pos.add(direction.scale(wind.speed * dt()));
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
            color: rgb(255, 255, 255),
        });
    });
}

// Draw the minimap
function drawMinimap() {
    drawRect({
        fixed: true,
        pos: vec2(10, 10),
        width: minimapSize.x,
        height: minimapSize.y,
        outline: { width: 1, color: rgb(255, 255, 255) },
        color: rgb(0, 0, 0, 0.5),
    });

    // Draw current player's boat
    const minimapBoatPos = sailboat.pos.scale(minimapScale);
    drawRect({
        fixed: true,
        pos: vec2(10, 10).add(minimapBoatPos),
        width: 5,
        height: 5,
        color: rgb(255, 149, 0),
    });

    // Draw other players' boats
    for (const id in otherPlayers) {
        const otherPlayer = otherPlayers[id];
        const otherBoatPos = vec2(otherPlayer.pos.x, otherPlayer.pos.y).scale(minimapScale);
        drawRect({
            fixed: true,
            pos: vec2(10, 10).add(otherBoatPos),
            width: 5,
            height: 5,
            color: rgb(0, 255, 0),
        });
    }
}

// Rotate vector by angle
function rotateVector(vector, angle) {
    const rad = deg2rad(angle);
    const x = vector.x * Math.cos(rad) - vector.y * Math.sin(rad);
    const y = vector.x * Math.sin(rad) + vector.y * Math.cos(rad);
    return vec2(x, y);
}

// Apply wind effect to the sailboat
function applyWindToSailboat() {
    const windDirection = rotateVector(vec2(1, 0), windAngle);
    const angleBetween = 0.001 + Math.abs(windDirection.angle() - sailboat.angle + sailboat.sailAngle);
    const windForce = Math.cos(toRadians(90 - angleBetween)) * 100;
    const appliedForce = 0.1 * 100 * Math.sqrt(Math.abs(windForce)) * Math.cos(toRadians(sailboat.sailAngle - windAngle));

    sailboat.windEffect = appliedForce;

    sailboat.move(
        sailboat.windEffect * Math.cos(toRadians(sailboat.angle - 90)),
        sailboat.windEffect * Math.sin(toRadians(sailboat.angle - 90))
    );
}

// Handle input for sail adjustment
onKeyDown("a", () => {
    sailboat.sailAngle = Math.max(sailboat.sailAngle - 2, minSailAngle);
    updateSail();
});
onKeyDown("d", () => {
    sailboat.sailAngle = Math.min(sailboat.sailAngle + 2, maxSailAngle);
    updateSail();
});

// Handle input for tacking
onKeyDown("space", () => {
    sailboat.reverse = !sailboat.reverse;
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
        text: "Speed: " + Math.abs(Math.round(sailboat.windEffect) / 10) + " knots",
        pos: vec2(width() - 200, height() - 50),
        anchor: "center",
        color: rgb(255, 255, 255),
        layer: "ui",
        size: 30,
        fixed: true,
    });
    drawText({
        text: "Windspeed: " + Math.round(windSpeed) / 10 + " knots",
        pos: vec2(width() - 200, height() - 25),
        anchor: "center",
        size: 30,
        color: rgb(255, 255, 255),
        layer: "ui",
        fixed: true,
    });
});

// Camera follows player and restricts movement within minimap bounds
sailboat.onUpdate(() => {
    camPos(sailboat.pos);

    const mapBounds = {
        left: 0,
        right: width(),
        top: 0,
        bottom: height(),
    };

    // Restrict sailboat movement within the minimap bounds
    sailboat.pos.x = clamp(sailboat.pos.x, mapBounds.left, mapBounds.right);
    sailboat.pos.y = clamp(sailboat.pos.y, mapBounds.top, mapBounds.bottom);
});

// Convert degrees to radians
function toRadians(angleInDegrees) {
    return (angleInDegrees * Math.PI) / 180;
}

// Change wind direction periodically
function changeWindDirection() {
    windAngle = rand(-90, 90);
    windLines.forEach(wind => {
        wind.angle = windAngle;
    });
}
function changeWindSpeed() {
    windSpeed = rand(0, 200);
}

// Set interval to change the wind direction
loop(windChangeInterval, () => {
    changeWindDirection();
    changeWindSpeed();
});

// Main update loop
onUpdate(() => {
    updateWindLines();
    updateSail();
    applyWindToSailboat();
    updatePlayerState();
    updateOtherPlayers(); // Update other players' boats and sails
});

// Draw functions
onDraw(() => {
    drawWindLines();
    drawMinimap();
});

// Multiplayer integration with Supabase

// Subscribe to the real-time channel
const channel = supabase.channel('sailboat-game', {
    config: {
        broadcast: { self: true },
        presence: { key: playerId },
    },
});

// Track presence (connected players)
channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    for (const id in state) {
        if (id !== playerId) {
            if (!otherPlayers[id]) {
                // Add new player
                otherPlayers[id] = {
                    id,
                    pos: { x: width() / 2, y: height() / 2 },
                    angle: 0,
                    sailAngle: 0,
                    boat: add([
                        sprite("sailboat"),
                        pos(width() / 2, height() / 2),
                        anchor("center"),
                        area(),
                        scale(6, 6),
                        rotate(0),
                    ]),
                    sail: add([
                        rect(10, 50),
                        pos(width() / 2, height() / 2),
                        anchor("bot"),
                        color(255, 255, 255),
                        rotate(0),
                    ]),
                };
            }
        }
    }
});

// Handle when a player leaves
channel.on('presence', { event: 'leave' }, ({ key }) => {
    if (otherPlayers[key]) {
        destroy(otherPlayers[key].boat);
        destroy(otherPlayers[key].sail);
        delete otherPlayers[key];
    }
});

// Receive broadcasts from other players
channel.on('broadcast', { event: 'player-update' }, ({ payload }) => {
    const { id, pos, angle, sailAngle } = payload;
    if (id !== playerId) {
        if (!otherPlayers[id]) {
            // Add new player if not already present
            otherPlayers[id] = {
                id,
                pos,
                angle,
                sailAngle,
                boat: add([
                    sprite("sailboat"),
                    pos(pos.x, pos.y),
                    anchor("center"),
                    area(),
                    scale(6, 6),
                    rotate(angle),
                ]),
                sail: add([
                    rect(10, 50),
                    pos(pos.x, pos.y),
                    anchor("bot"),
                    color(255, 255, 255),
                    rotate(angle + sailAngle),
                ]),
            };
        } else {
            otherPlayers[id].pos = pos;
            otherPlayers[id].angle = angle;
            otherPlayers[id].sailAngle = sailAngle;
        }
    }
});

// Update other players' boats and sails
function updateOtherPlayers() {
    for (const id in otherPlayers) {
        const player = otherPlayers[id];
        player.boat.pos = vec2(player.pos.x, player.pos.y);
        player.boat.angle = player.angle;

        // Update sail position and rotation
        const sailOffset = rotateVector(vec2(0, -10), player.angle);
        player.sail.pos = player.boat.pos.add(sailOffset);
        player.sail.angle = player.angle + player.sailAngle;
    }
}

// Update current player's state and broadcast it
function updatePlayerState() {
    playerState.pos = { x: sailboat.pos.x, y: sailboat.pos.y };
    playerState.angle = sailboat.angle;
    playerState.sailAngle = sailboat.sailAngle;

    channel.send({
        type: 'broadcast',
        event: 'player-update',
        payload: playerState,
    });
}

// Subscribe and track presence
channel.subscribe(async status => {
    if (status === 'SUBSCRIBED') {
        await channel.track(playerState);
    }
});
