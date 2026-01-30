import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import StockTicker from '../StockTicker';
import AIAssistant from '../AIAssistant';

const Layout = ({ children }: { children?: React.ReactNode }) => {
    return (
        <div className="app-layout has-ticker">
            <Sidebar />
            <StockTicker />
            <main className="main-content">
                {children || <Outlet />}
            </main>
            <AIAssistant />
        </div>
    );
};

export default Layout;
