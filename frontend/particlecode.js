(async () => {
    await loadBigCirclesPreset(tsParticles);
  
    await tsParticles.load({
      id: "tsparticles",
      options: {
        preset: "bigCircles", // also "big-circles" is accepted
      },
    });
  })();