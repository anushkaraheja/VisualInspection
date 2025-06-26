import app from '@/lib/app';
import useOrgTheme from 'hooks/useOrgTheme';
import useTeam from 'hooks/useTeam';
import Image from 'next/image';
import { useRouter } from 'next/router';

// Shimmer effect component for loading state
const ShimmerEffect = () => (
  <div className="flex items-center gap-2 animate-pulse">
    <div className="w-[30px] h-[30px] rounded-full bg-gray-200 dark:bg-gray-700" />
    <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
);

const Brand = () => {
  const router = useRouter();
  const { theme, loading } = useOrgTheme(router.query.slug as string);
  const { team, isLoading } = useTeam(router.query.slug as string);

  // Show shimmer while loading
  if (loading || isLoading) {
    return <ShimmerEffect />;
  }

  return (
    <div className="flex shrink-0 justify-center items-center text-[28px] font-semibold gap-2 dark:text-gray-100 max-w-[200px] sm:max-w-[250px] md:max-w-[300px]">
      <Image
        src={theme.logo ?? app.logoUrl}
        alt={app.name}
        width={30}
        height={30}
      />
      <span className="truncate">{team?.name}</span>
    </div>
  );
};

export default Brand;
