(async () => {
  await loadFireworksPreset(tsParticles);

  await tsParticles.load({
    id: "tsparticles",
    options: {
      preset: "fireworks",
    }
  });
})();