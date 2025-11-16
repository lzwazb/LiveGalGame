import { Link, useLocation } from 'react-router-dom';

function Layout({ children }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8f6f7', color: '#1b0e14' }}>
      {/* 左侧导航栏 */}
      <aside style={{ display: 'flex', height: '100vh', width: '180px', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(to bottom, #d81b60, #8e24aa)', padding: '16px', color: 'white' }}>
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundColor: '#ffffff',
                backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23c51662"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>')`
              }}
            />
            <div className="flex flex-col">
              <h1 className="text-white text-base font-bold leading-normal">LiveGalGame</h1>
              <p className="text-white/80 text-sm font-normal leading-normal">对话管理器</p>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex flex-col gap-2">
            <Link
              to="/"
              className={`nav-item flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isActive('/')
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span 
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive('/') ? "'FILL' 1" : "'FILL' 0" }}
              >
                dashboard
              </span>
              <p className="text-sm font-medium leading-normal">总览</p>
            </Link>
            <Link
              to="/characters"
              className={`nav-item flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isActive('/characters')
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span 
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive('/characters') ? "'FILL' 1" : "'FILL' 0" }}
              >
                groups
              </span>
              <p className="text-sm font-medium leading-normal">攻略对象</p>
            </Link>
            <Link
              to="/conversations"
              className={`nav-item flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isActive('/conversations')
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span 
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive('/conversations') ? "'FILL' 1" : "'FILL' 0" }}
              >
                history
              </span>
              <p className="text-sm font-medium leading-normal">历史对话</p>
            </Link>
            <Link
              to="/settings"
              className={`nav-item flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isActive('/settings')
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span 
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive('/settings') ? "'FILL' 1" : "'FILL' 0" }}
              >
                settings
              </span>
              <p className="text-sm font-medium leading-normal">设置</p>
            </Link>
          </nav>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default Layout;

