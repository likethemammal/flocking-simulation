import React, { useState, useEffect, useRef } from "react";
import {
  Stage,
  Layer,
  Ellipse,
  Line,
  Circle,
  Group,
  Shape,
  Path,
} from "react-konva";

class Fish {
  constructor(x, y, followsMouse, canvas) {
    this.x = x;
    this.y = y;
    this.vx = Math.random() * 4 - 2;
    this.vy = Math.random() * 4 - 2;
    this.angle = Math.atan2(this.vy, this.vx);
    this.followsMouse = followsMouse;
    this.size = 12 + Math.random() * 4;
    this.canvas = canvas;
  }

  update(fishes, mouseX, mouseY, baseSpeed, maxSpeed, orbitDistance) {
    const alignmentRadius = 50;
    const cohesionRadius = 70;
    const separationRadius = 25;

    let alignX = 0,
      alignY = 0;
    let cohesionX = 0,
      cohesionY = 0;
    let separationX = 0,
      separationY = 0;
    let alignCount = 0,
      cohesionCount = 0,
      separationCount = 0;

    if (this.followsMouse && mouseX !== null && mouseY !== null) {
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distToMouse = Math.sqrt(dx * dx + dy * dy);

      // Calculate target point based on orbit distance
      if (distToMouse > 0) {
        const targetDist = orbitDistance;
        const targetX = mouseX - (dx / distToMouse) * targetDist;
        const targetY = mouseY - (dy / distToMouse) * targetDist;

        // Add orbital velocity component
        const orbitSpeed = baseSpeed * 2;
        const tangentX = -dy / distToMouse;
        const tangentY = dx / distToMouse;

        // Blend between orbiting and approaching based on distance
        const distanceFactor = Math.min(
          Math.abs(distToMouse - targetDist) / targetDist,
          1
        );
        const approachStrength = 0.5 * distanceFactor;
        const orbitStrength = 0.5 * (1 - distanceFactor);

        // Apply forces
        this.vx +=
          ((targetX - this.x) * approachStrength +
            tangentX * orbitStrength * orbitSpeed) *
          baseSpeed;
        this.vy +=
          ((targetY - this.y) * approachStrength +
            tangentY * orbitStrength * orbitSpeed) *
          baseSpeed;
      }
    }

    fishes.forEach((other) => {
      if (other === this) return;

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < alignmentRadius) {
        alignX += other.vx;
        alignY += other.vy;
        alignCount++;
      }

      if (distance < cohesionRadius) {
        cohesionX += other.x;
        cohesionY += other.y;
        cohesionCount++;
      }

      if (distance < separationRadius) {
        separationX -= dx / distance;
        separationY -= dy / distance;
        separationCount++;
      }
    });

    if (alignCount > 0) {
      this.vx += (alignX / alignCount - this.vx) * 0.05 * baseSpeed;
      this.vy += (alignY / alignCount - this.vy) * 0.05 * baseSpeed;
    }

    if (cohesionCount > 0) {
      const centerX = cohesionX / cohesionCount;
      const centerY = cohesionY / cohesionCount;
      this.vx += (centerX - this.x) * 0.001 * baseSpeed;
      this.vy += (centerY - this.y) * 0.001 * baseSpeed;
    }

    if (separationCount > 0) {
      this.vx += separationX * 0.05 * baseSpeed;
      this.vy += separationY * 0.05 * baseSpeed;
    }

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const fishMaxSpeed = this.followsMouse ? maxSpeed * 1.25 : maxSpeed;

    if (speed > fishMaxSpeed) {
      this.vx = (this.vx / speed) * fishMaxSpeed;
      this.vy = (this.vy / speed) * fishMaxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.angle = Math.atan2(this.vy, this.vx);

    if (this.x < 0) this.x = this.canvas.width;
    if (this.x > this.canvas.width) this.x = 0;
    if (this.y < 0) this.y = this.canvas.height;
    if (this.y > this.canvas.height) this.y = 0;
  }
}

const FishComponent = ({ fish }) => {
  const color = fish.followsMouse ? "#4A90E2" : "#FF6B6B";
  const finColor = fish.followsMouse ? "#67A9F0" : "#FF8787";

  const tailSize = 5;
  const tailShapeRatio = 3 / 10;
  const tailOffset = 15;
  const ovalRatio = 2 / 5.8;

  return (
    <Group x={fish.x} y={fish.y} rotation={(fish.angle * 180) / Math.PI}>
      <Line
        points={[
          -fish.size + tailOffset,
          0,
          -fish.size - tailSize,
          -fish.size * tailShapeRatio,
          -fish.size - tailSize,
          fish.size * tailShapeRatio,
        ]}
        closed={true}
        fill={finColor}
      />
      <Ellipse
        radiusX={fish.size}
        radiusY={fish.size * ovalRatio}
        fill={color}
      />
    </Group>
  );
};

const FishSimulation = () => {
  const totalFish = 20;
  const mouseFollowerCount = 10;

  const [fishes, setFishes] = useState([]);
  const [mousePos, setMousePos] = useState({ x: null, y: null });
  const [baseSpeed, setBaseSpeed] = useState(0.05);
  const [maxSpeed, setMaxSpeed] = useState(1);
  const canvasWidth = 600;
  const canvasHeight = 400;
  const stageRef = useRef(null);
  const animationFrameRef = useRef();
  const [orbitDistance, setOrbitDistance] = useState(50);

  useEffect(() => {
    const canvas = { width: canvasWidth, height: canvasHeight };

    const newFishes = Array(totalFish)
      .fill()
      .map(
        (_, i) =>
          new Fish(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            i < mouseFollowerCount,
            canvas
          )
      );

    setFishes(newFishes);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      setFishes((prevFishes) => {
        const updatedFishes = [...prevFishes];
        updatedFishes.forEach((fish) => {
          fish.update(
            updatedFishes,
            mousePos.x,
            mousePos.y,
            baseSpeed,
            maxSpeed
          );
        });
        return updatedFishes;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos, baseSpeed, maxSpeed]);

  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    if (stage) {
      const pos = stage.getPointerPosition();
      setMousePos({ x: pos.x, y: pos.y });
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Fish Flocking Simulation
        </h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Orbit Distance: {orbitDistance}px
          </label>
          <input
            type="range"
            min="20"
            max="150"
            step="5"
            value={orbitDistance}
            onChange={(e) => setOrbitDistance(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Base Speed: {baseSpeed.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={baseSpeed}
              onChange={(e) => setBaseSpeed(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Max Speed: {maxSpeed.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.01"
              max="2"
              step="0.01"
              value={maxSpeed}
              onChange={(e) => setMaxSpeed(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="rounded-lg overflow-hidden bg-gradient-to-b from-blue-300 to-blue-500">
            <Stage width={canvasWidth} height={canvasHeight} ref={stageRef}>
              <Layer>
                {mousePos.x !== null && mousePos.y !== null && (
                  <>
                    <Circle
                      x={mousePos.x}
                      y={mousePos.y}
                      radius={8}
                      fill="rgba(255, 255, 255, 0.3)"
                    />
                    <Circle
                      x={mousePos.x}
                      y={mousePos.y}
                      radius={orbitDistance}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth={1}
                    />
                  </>
                )}
                {fishes.map((fish, i) => (
                  <FishComponent key={i} fish={fish} />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FishSimulation;
