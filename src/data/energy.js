const MAP_DIMENSIONS = { width: 1400, height: 1060 };

const CITY_DATA = [
  {
    id: 'new-york',
    name: 'New York',
    longitude: -74,
    latitude: 40.7,
    pixel: [412, 289],
    carbonIntensity: 320,
    generationMw: 98000,
    consumptionMw: 93000,
    mix: {
      solar: 12000,
      wind: 16000,
      hydro: 11000,
      fossil: 52000,
      other: 7000
    }
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    longitude: -118.2,
    latitude: 34,
    pixel: [240, 331],
    carbonIntensity: 290,
    generationMw: 61000,
    consumptionMw: 60000,
    mix: {
      solar: 18000,
      wind: 9000,
      hydro: 5000,
      fossil: 26000,
      other: 3000
    }
  },
  {
    id: 'mexico-city',
    name: 'Mexico City',
    longitude: -99.1,
    latitude: 19.4,
    pixel: [315, 416],
    carbonIntensity: 470,
    generationMw: 54000,
    consumptionMw: 56000,
    mix: {
      solar: 8000,
      wind: 6000,
      hydro: 7000,
      fossil: 30000,
      other: 3000
    }
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo',
    longitude: -46.6,
    latitude: -23.5,
    pixel: [519, 672],
    carbonIntensity: 120,
    generationMw: 68000,
    consumptionMw: 64000,
    mix: {
      solar: 9000,
      wind: 14000,
      hydro: 33000,
      fossil: 9000,
      other: 3000
    }
  },
  {
    id: 'buenos-aires',
    name: 'Buenos Aires',
    longitude: -58.4,
    latitude: -34.6,
    pixel: [474, 643],
    carbonIntensity: 350,
    generationMw: 42000,
    consumptionMw: 43000,
    mix: {
      solar: 5000,
      wind: 7000,
      hydro: 9000,
      fossil: 20000,
      other: 1000
    }
  },
  {
    id: 'london',
    name: 'London',
    longitude: -0.1,
    latitude: 51.5,
    pixel: [700, 226],
    carbonIntensity: 220,
    generationMw: 42000,
    consumptionMw: 39000,
    mix: {
      solar: 6000,
      wind: 18000,
      hydro: 4000,
      fossil: 12000,
      other: 2000
    }
  },
  {
    id: 'paris',
    name: 'Paris',
    longitude: 2.3,
    latitude: 48.9,
    pixel: [707, 245],
    carbonIntensity: 210,
    generationMw: 41000,
    consumptionMw: 40000,
    mix: {
      solar: 7000,
      wind: 15000,
      hydro: 6000,
      fossil: 11000,
      other: 2000
    }
  },
  {
    id: 'moscow',
    name: 'Moscow',
    longitude: 37.6,
    latitude: 55.8,
    pixel: [849, 201],
    carbonIntensity: 520,
    generationMw: 76000,
    consumptionMw: 78000,
    mix: {
      solar: 4000,
      wind: 8000,
      hydro: 20000,
      fossil: 42000,
      other: 2000
    }
  },
  {
    id: 'cairo',
    name: 'Cairo',
    longitude: 31.2,
    latitude: 30,
    pixel: [824, 354],
    carbonIntensity: 430,
    generationMw: 34000,
    consumptionMw: 36000,
    mix: {
      solar: 9000,
      wind: 4000,
      hydro: 6000,
      fossil: 14000,
      other: 1000
    }
  },
  {
    id: 'johannesburg',
    name: 'Johannesburg',
    longitude: 28,
    latitude: -26.2,
    pixel: [809, 682],
    carbonIntensity: 610,
    generationMw: 28000,
    consumptionMw: 31000,
    mix: {
      solar: 3000,
      wind: 4000,
      hydro: 2000,
      fossil: 18000,
      other: 1000
    }
  },
  {
    id: 'new-delhi',
    name: 'New Delhi',
    longitude: 77.2,
    latitude: 28.6,
    pixel: [998, 364],
    carbonIntensity: 640,
    generationMw: 155000,
    consumptionMw: 158000,
    mix: {
      solar: 28000,
      wind: 24000,
      hydro: 19000,
      fossil: 81000,
      other: 3000
    }
  },
  {
    id: 'beijing',
    name: 'Beijing',
    longitude: 116.4,
    latitude: 39.9,
    pixel: [1137, 301],
    carbonIntensity: 580,
    generationMw: 220000,
    consumptionMw: 215000,
    mix: {
      solar: 26000,
      wind: 36000,
      hydro: 52000,
      fossil: 99000,
      other: 7000
    }
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    longitude: 139.7,
    latitude: 35.7,
    pixel: [1226, 331],
    carbonIntensity: 520,
    generationMw: 98000,
    consumptionMw: 103000,
    mix: {
      solar: 20000,
      wind: 7000,
      hydro: 11000,
      fossil: 58000,
      other: 2000
    }
  },
  {
    id: 'sydney',
    name: 'Sydney',
    longitude: 151.2,
    latitude: -33.9,
    pixel: [1271, 729],
    carbonIntensity: 410,
    generationMw: 46000,
    consumptionMw: 44000,
    mix: {
      solar: 12000,
      wind: 10000,
      hydro: 5000,
      fossil: 17000,
      other: 2000
    }
  }
];

function toPercent([x, y]) {
  const xPercent = (x / MAP_DIMENSIONS.width) * 100;
  const yPercent = (y / MAP_DIMENSIONS.height) * 100;
  return [Number(xPercent.toFixed(3)), Number(yPercent.toFixed(3))];
}

function createHistory(hours, balanceMw) {
  const records = [];
  const amplitude = Math.max(1, Math.abs(balanceMw));
  for (let i = hours; i >= 1; i -= 1) {
    const swing = (Math.sin((i / hours) * Math.PI * 2) + Math.random() - 0.5) * amplitude * 0.25;
    records.push({
      netBalanceMw: Math.round(balanceMw + swing)
    });
  }
  return records;
}

function createRegion(city) {
  const renewableGeneration = city.mix.solar + city.mix.wind + city.mix.hydro;
  return {
    regionId: city.id,
    regionName: city.name,
    coordinates: [city.longitude, city.latitude],
    mapPosition: toPercent(city.pixel),
    generationMw: city.generationMw,
    consumptionMw: city.consumptionMw,
    renewableShare: Number((renewableGeneration / city.generationMw).toFixed(2)),
    carbonIntensity: city.carbonIntensity,
    mix: { ...city.mix },
    history: createHistory(24, city.generationMw - city.consumptionMw)
  };
}

export function generateEnergyData() {
  const regions = CITY_DATA.map(createRegion);
  return {
    updatedAt: new Date().toISOString(),
    regions
  };
}
