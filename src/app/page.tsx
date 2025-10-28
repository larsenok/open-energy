import Providers from './components/Providers';
import dynamic from 'next/dynamic';

const MapScene = dynamic(() => import('./components/MapScene'), { ssr: false });

export default function Page() {
  return (
    <Providers>
      <MapScene />
    </Providers>
  );
}
