import { Button } from '@/components/shadcn/button';
import { useWeb3Auth } from '@web3auth/modal-react-hooks';

const Web3AuthTest = () => {
  const { isConnected, userInfo, connect, logout } = useWeb3Auth();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-center text-foreground my-6">Web3Auth Test</h2>

      {!isConnected ? (
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Connect your wallet to access the application
          </p>
          <Button onClick={handleConnect}>Connect Wallet</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            {userInfo?.profileImage && (
              <img
                src={userInfo.profileImage}
                alt="Profile"
                className="w-20 h-20 rounded-full border-2 border-primary mb-3"
              />
            )}
            <h3 className="text-xl font-semibold text-foreground">
              {userInfo?.name || 'Anonymous User'}
            </h3>
            {userInfo?.email && <p className="text-muted-foreground text-sm">{userInfo.email}</p>}
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-2">User Information</h4>
            <div className="space-y-2">
              {userInfo?.typeOfLogin && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Login Type</span>
                  <span className="text-xs font-medium">{userInfo.typeOfLogin}</span>
                </div>
              )}
              {userInfo?.verifier && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Verifier</span>
                  <span className="text-xs font-medium">{userInfo.verifier}</span>
                </div>
              )}
              {userInfo?.verifierId && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Verifier ID</span>
                  <span className="text-xs font-medium truncate max-w-[180px]">
                    {userInfo.verifierId}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
    </div>
  );
};

export default Web3AuthTest;
