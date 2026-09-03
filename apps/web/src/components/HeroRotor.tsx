import { useMemo } from "react";

const PILL_COUNT = 16;
const RADIUS = 340;

const GRADIENTS = [
  "linear-gradient(165deg, #e8e0ff 0%, #c4b5fd 40%, #1a1a2e 100%)",
  "linear-gradient(165deg, #ffd6e0 0%, #ff9a9e 50%, #2d1b4e 100%)",
  "linear-gradient(165deg, #d4fc79 0%, #96e6a1 30%, #0f0c29 100%)",
  "linear-gradient(165deg, #667eea 0%, #764ba2 55%, #111 100%)",
  "linear-gradient(165deg, #fdfbfb 0%, #ebedee 40%, #d299c2 100%)",
  "linear-gradient(165deg, #a1c4fd 0%, #c2e9fb 50%, #434343 100%)",
  "linear-gradient(165deg, #f093fb 0%, #f5576c 45%, #0c0c0c 100%)",
  "linear-gradient(165deg, #4facfe 0%, #00f2fe 40%, #141e30 100%)",
];

export default function HeroRotor() {
  const pills = useMemo(
    () =>
      Array.from({ length: PILL_COUNT }, (_, i) => {
        const angle = (360 / PILL_COUNT) * i;
        const tilt = i * 4 - 28;
        return {
          angle,
          tilt,
          background: GRADIENTS[i % GRADIENTS.length],
        };
      }),
    []
  );

  return (
    <div className="rotor-stage" aria-hidden="true">
      <div className="rotor-ring">
        {pills.map((pill, i) => (
          <div
            key={i}
            className="rotor-pill"
            style={{
              background: pill.background,
              transform: `rotateY(${pill.angle}deg) translateZ(${RADIUS}px) rotateX(${pill.tilt}deg)`,
            }}
          />
        ))}
      </div>
      <div className="rotor-ring rotor-ring--ghost">
        {pills.map((pill, i) => (
          <div
            key={`g-${i}`}
            className="rotor-pill rotor-pill--ghost"
            style={{
              background: pill.background,
              transform: `rotateY(${pill.angle + 180}deg) translateZ(${RADIUS - 40}px) rotateX(${pill.tilt}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
