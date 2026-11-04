// Homepage map: every farm, pins for exact hives and dashed areas for approximate ones.
// Clicking one opens it on the Map page. Needs js/maps.js and js/data.js.

(async function () {
  const el = document.getElementById('homeMap');
  if (!el || typeof HTMap === 'undefined') return;

  const map = HTMap.create(el, { center: [39.5, -80], zoom: 5 });
  if (!map) return;

  const farms = await getFarms();
  const layers = farms.map(farm => {
    // National view: no forage circles (they'd be too small to see)
    const { markers } = HTMap.farmMarkers(farm, { radii: false });
    markers.forEach(m => m.on('click', () => {
      window.location.href = `map.html?farm=${encodeURIComponent(farm.id)}`;
    }));
    return markers;
  }).flat();

  const group = L.featureGroup(layers).addTo(map);
  map.fitBounds(group.getBounds(), { padding: [40, 40] });

})();
