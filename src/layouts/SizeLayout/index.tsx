import { useLocation } from 'react-router-dom';

const SizeLayout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const isEvent = pathname.startsWith('/event');

  return (
    <div className={cn('w-full h-full', !isEvent && 'min-w-[360px] min-h-[600px]')}>{children}</div>
  );
};

export default SizeLayout;
