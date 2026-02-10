import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    Calendar,
    BookOpen,
    Target,
    TrendingUp,
    Sparkles,
    LogOut,
    Menu,
    X,
    Kanban,
    Home as HomeIcon
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        base44.auth.logout();
    };

    const navItems = [
        { name: 'Home', path: 'Home', icon: Sparkles },
        { name: 'Atividades', path: 'Atividades', icon: Calendar },
        { name: 'Diário', path: 'Diario', icon: BookOpen },
        { name: 'Kanban', path: 'Kanban', icon: Kanban },
        { name: 'Relatórios', path: 'Relatorios', icon: TrendingUp },
        { name: 'Metas', path: 'Metas', icon: Target },
    ];

    const getBreadcrumbs = () => {
        const breadcrumbs = [{ name: 'Home', path: 'Home' }];
        
        if (currentPageName && currentPageName !== 'Home') {
            const currentNav = navItems.find(item => item.path === currentPageName);
            if (currentNav) {
                breadcrumbs.push({ name: currentNav.name, path: currentNav.path });
            }
        }
        
        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-indigo-600" />
                            <span className="text-2xl font-bold text-slate-900">PlannerDig</span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPageName === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={createPageUrl(item.path)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                            isActive
                                                ? 'bg-indigo-100 text-indigo-700 font-medium'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="ml-2 text-slate-600 hover:text-slate-900"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sair
                            </Button>
                        </nav>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6 text-slate-600" />
                            ) : (
                                <Menu className="w-6 h-6 text-slate-600" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-slate-200">
                            <nav className="flex flex-col gap-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = currentPageName === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={createPageUrl(item.path)}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                                isActive
                                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 text-left"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Sair</span>
                                </button>
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Breadcrumbs */}
            {currentPageName && currentPageName !== 'Home' && (
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={crumb.path}>
                                        {index > 0 && <BreadcrumbSeparator />}
                                        <BreadcrumbItem>
                                            {index === breadcrumbs.length - 1 ? (
                                                <BreadcrumbPage className="flex items-center gap-2">
                                                    {index === 0 && <HomeIcon className="w-4 h-4" />}
                                                    {crumb.name}
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <Link to={createPageUrl(crumb.path)} className="flex items-center gap-2">
                                                        {index === 0 && <HomeIcon className="w-4 h-4" />}
                                                        {crumb.name}
                                                    </Link>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                    </React.Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
}