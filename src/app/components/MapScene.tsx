'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import type { EnergyResponse, EnergySnapshot } from '@/types/energy';
import styles from '../styles/map.module.css';
import EnergyTooltip from './tooltip/EnergyTooltip';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

type FeatureProperties = EnergySnapshot & {
  coordinates: [number, number];
  balance: number;
};

type GeoFeature = GeoJSON.Feature<GeoJSON.Point, FeatureProperties>;

const REGION_COORDINATES: Record<string, [number, number]> = {
  'eu-central': [10.4515, 51.1657],
  'us-conus': [-98.5795, 39.8283],
  'br-iso': [-51.9253, -14.235]
};

function toFeature(snapshot: EnergySnapshot): GeoFeature {
  const coords = REGION_COORDINATES[snapshot.regionId] ?? [0, 0];
  const balance = snapshot.generationMw - snapshot.consumptionMw;
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coords
    },
    properties: {
      ...snapshot,
      coordinates: coords,
      balance
    }
  };
}

const BREATHING_SPEED = 4000;

const fetchEnergy = async (): Promise<EnergyResponse> => {
  const res = await fetch('/api/energy');
  if (!res.ok) {
    throw new Error('Failed to load energy data');
  }
  return res.json();
};

export default function MapScene() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const animationRef = useRef<number>();
  const [hoverFeature, setHoverFeature] = useState<FeatureProperties | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureProperties | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['energy'],
    queryFn: fetchEnergy,
    refetchInterval: 60 * 1000
  });

  const features = useMemo<GeoFeature[]>(() => {
    if (!data?.regions) return [];
    return data.regions.map(toFeature);
  }, [data]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) {
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 10],
      zoom: 1.2,
      projection: 'globe',
      attributionControl: false
    });

    mapRef.current = map;

    map.on('style.load', () => {
      map.setFog({});

      map.addSource('energy-regions', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'energy-pulse',
        type: 'circle',
        source: 'energy-regions',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0,
            12,
            1,
            32
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.45
        }
      });

      map.addLayer({
        id: 'energy-core',
        type: 'circle',
        source: 'energy-regions',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0,
            6,
            1,
            14
          ],
          'circle-color': ['get', 'coreColor'],
          'circle-blur': 0.3
        }
      });

      map.on('mousemove', 'energy-core', (event) => {
        const feature = event.features?.[0] as GeoFeature | undefined;
        if (feature) {
          setHoverFeature(feature.properties);
        }
      });

      map.on('mouseleave', 'energy-core', () => {
        setHoverFeature(null);
      });

      map.on('click', 'energy-core', (event) => {
        const feature = event.features?.[0] as GeoFeature | undefined;
        if (feature) {
          setSelectedFeature((current) =>
            current?.regionId === feature.properties.regionId ? null : feature.properties
          );
        }
      });
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const startAnimation = () => {
      const source = map.getSource('energy-regions') as mapboxgl.GeoJSONSource | undefined;
      if (!source) {
        return;
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const start = performance.now();

      const animate = () => {
        const elapsed = performance.now() - start;
        const pulse = (Math.sin((elapsed % BREATHING_SPEED) / BREATHING_SPEED * 2 * Math.PI) + 1) / 2;

        const geojson: GeoJSON.FeatureCollection<GeoJSON.Point, GeoJSON.GeoJsonProperties> = {
          type: 'FeatureCollection',
          features: features.map((feature) => {
            const balance = feature.properties.balance;
            const normalized = Math.max(
              -1,
              Math.min(1, balance / Math.max(feature.properties.consumptionMw, 1))
            );
            const strength = Math.abs(normalized);
            const hue = normalized >= 0 ? 140 : 30; // greenish for surplus, amber for deficit
            const saturation = 70 + strength * 30;
            const lightness = 45 + pulse * 10;
            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            const coreColor = `hsl(${hue}, ${Math.min(100, saturation + 10)}%, ${Math.max(30, 40 - strength * 10)}%)`;

            return {
              ...feature,
              properties: {
                ...feature.properties,
                pulse,
                color,
                coreColor
              }
            };
          })
        };

        source.setData(geojson);
        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
    };

    if (map.isStyleLoaded()) {
      startAnimation();
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }

    const onLoad = () => {
      startAnimation();
    };

    map.on('styledata', onLoad);

    return () => {
      map.off('styledata', onLoad);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [features]);

  const tooltipTarget = selectedFeature ?? hoverFeature;

  return (
    <div className={styles.scene}>
      <div ref={mapContainer} id="map-container" className={selectedFeature ? styles.paused : ''} />
      {(hoverFeature || selectedFeature) && tooltipTarget ? (
        <EnergyTooltip feature={tooltipTarget} frozen={Boolean(selectedFeature)} onClose={() => setSelectedFeature(null)} />
      ) : null}
      <div className={styles.overlay}>
        <div className={styles.titleBlock}>
          <h1>Human Energy Exchange</h1>
          <p>
            A living portrait of the planet&apos;s electricity balance — regions expand with clean
            surplus and glow warmer under strain.
          </p>
          {isLoading && <span className={styles.status}>Loading live grid signals…</span>}
          {error && <span className={styles.statusError}>Unable to reach energy services.</span>}
          {data && <span className={styles.timestamp}>Updated {new Date(data.updatedAt).toLocaleTimeString()}</span>}
        </div>
      </div>
    </div>
  );
}
