export const WebvisStream = ({
  url,
  status,
  fit = false,
}: {
  url: string;
  status: boolean;
  fit?: boolean;
}) => {
  // Don't render anything if url is not provided (extra safety)
  if (!url) {
    return (
      <div style={{ 
        background: '#000', 
        minHeight: fit ? '100%' : 450,
        height: fit ? '100%' : 'auto',
        width: '100%',
        position: 'relative',
      }}>
        <div className="flex items-center justify-center h-full w-full text-gray-500">
          Stream configuration unavailable
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#000', 
      minHeight: fit ? '100%' : 450,
      height: fit ? '100%' : 'auto',
      width: '100%',
      position: 'relative',
    }}>
      {status ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={url}
            alt={'FRAMES'}
            style={{
              background: 'black',
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              minWidth: fit ? '50%' : 'auto',
              width: fit ? 'auto' : '100%',
              height: fit ? '100%' : 'auto',
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Stream not available
        </div>
      )}
    </div>
  );
};
