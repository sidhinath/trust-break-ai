import React, { useEffect, useRef } from "react";

export function ConstellationField({
  mode = "dark",
  speed = 1,
  size = 1,
  density = 1,
  opacity = 0.5,
  className = "",
  style = {}
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = null;
    try {
      ctx = canvas.getContext("2d");
    } catch (e) {
      return;
    }
    if (!ctx) return;

    let animId = null;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Generate Particle Nodes
    const nodeCount = Math.max(15, Math.min(70, Math.floor((width < 768 ? 25 : 55) * density)));
    const nodes = [];

    const isLight = mode === "light";
    const particleColor = isLight ? "rgba(2, 132, 199, " : "rgba(0, 229, 255, ";
    const lineColor = isLight ? "rgba(2, 132, 199, " : "rgba(0, 229, 255, ";

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6 * speed,
        vy: (Math.random() - 0.5) * 0.6 * speed,
        radius: (Math.random() * 1.8 + 1.2) * size,
        alpha: Math.random() * 0.5 + 0.4,
      });
    }

    const maxLinkDist = width < 768 ? 100 : 140;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${particleColor}${n.alpha * opacity})`;
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLinkDist) {
            const linkAlpha = (1 - dist / maxLinkDist) * 0.25 * opacity;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `${lineColor}${linkAlpha})`;
            ctx.lineWidth = 0.8 * size;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [mode, speed, size, density, opacity]);

  return (
    <div className={`w-full h-full relative overflow-hidden pointer-events-none ${className}`} style={style}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

export default ConstellationField;
