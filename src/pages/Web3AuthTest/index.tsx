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
      <h2 className="text-2xl font-bold text-center text-gray-800 my-6">Web3Auth Test</h2>

      {!isConnected ? (
        <div className="text-center">
          <p className="text-gray-600 mb-6">Connect your wallet to access the application</p>
          <button
            onClick={handleConnect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 transform cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            {userInfo?.profileImage && (
              <img
                src={userInfo.profileImage}
                alt="Profile"
                className="w-20 h-20 rounded-full border-2 border-blue-500 mb-3"
              />
            )}
            <h3 className="text-xl font-semibold text-gray-800">
              {userInfo?.name || 'Anonymous User'}
            </h3>
            {userInfo?.email && <p className="text-gray-500 text-sm">{userInfo.email}</p>}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">User Information</h4>
            <div className="space-y-2">
              {userInfo?.typeOfLogin && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Login Type</span>
                  <span className="text-xs font-medium">{userInfo.typeOfLogin}</span>
                </div>
              )}
              {userInfo?.verifier && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Verifier</span>
                  <span className="text-xs font-medium">{userInfo.verifier}</span>
                </div>
              )}
              {userInfo?.verifierId && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Verifier ID</span>
                  <span className="text-xs font-medium truncate max-w-[180px]">
                    {userInfo.verifierId}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Web3AuthTest;
