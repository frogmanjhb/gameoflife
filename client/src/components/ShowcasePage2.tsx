import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Users,
  Briefcase,
  Home,
  TrendingUp,
  FileText,
  Trophy,
  ShoppingCart,
  Pizza,
  Calculator,
  AlertTriangle,
  Lightbulb,
  Newspaper,
  Building2,
  ArrowRight,
  LogIn,
  ScrollText,
  ClipboardList,
  Shield,
  Zap,
  School,
  UserCog,
} from 'lucide-react';

const ShowcasePage2: React.FC = () => {
  const features = [
    { icon: Wallet, title: 'Virtual Bank Account', description: 'Track balance, transactions, and manage money safely.', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: Users, title: 'Peer-to-Peer Transfers', description: 'Send money to classmates. Learn digital payments.', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: Briefcase, title: 'Jobs & Salaries', description: 'Apply for jobs, earn salaries, learn about work.', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: Home, title: 'Property Ownership', description: 'Buy land, build your portfolio, watch investments grow.', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { icon: TrendingUp, title: 'Loans & Planning', description: 'Apply for loans, learn repayment and borrowing.', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { icon: FileText, title: 'Tenders & Contracts', description: 'Bid on town projects, complete contracts, earn rewards.', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { icon: Calculator, title: 'Math Challenges', description: 'Play math games to earn money and practice skills.', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { icon: Trophy, title: 'Leaderboards', description: 'Compete with classmates on challenges and achievements.', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { icon: ShoppingCart, title: 'Shop & Customization', description: 'Winkel shop, emojis and profile accessories.', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
    { icon: Pizza, title: 'Pizza Time', description: 'Contribute to class goals and celebrate as a team.', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    { icon: Building2, title: 'Town Government', description: 'Civic responsibility, treasury, taxes, community.', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
    { icon: Newspaper, title: 'News & Announcements', description: 'Town news and community updates.', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
    { icon: AlertTriangle, title: 'Disasters & Challenges', description: 'Unexpected events teach resilience and planning.', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
    { icon: Lightbulb, title: 'Suggestions & Feedback', description: 'Share ideas, report bugs, improve the town.', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
    { icon: ScrollText, title: 'Town Rules', description: 'Class rules. Teachers edit per town.', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
    { icon: ClipboardList, title: 'Chores', description: 'Chore challenges via math game. Earn money, build habits.', iconBg: 'bg-lime-100', iconColor: 'text-lime-600' },
    { icon: Shield, title: 'Insurance', description: 'Protect assets. Learn about risk in the town economy.', iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
    { icon: Zap, title: 'Doubles Day', description: 'Special events with doubled rewards.', iconBg: 'bg-fuchsia-100', iconColor: 'text-fuchsia-600' },
  ];

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Hero - same style as ShowcasePage, compact */}
      <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold">CivicLab</h1>
              <p className="text-sm sm:text-base text-primary-100 mt-0.5">
                Learn Financial Literacy Through Interactive Play
              </p>
              <p className="text-xs sm:text-sm text-primary-200 max-w-2xl mt-1 hidden md:block">
                A multi-tenant town economy simulator for Grade 6. Master banking, jobs, loans, property, and civic responsibility in a safe virtual environment.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-all shadow-lg text-sm"
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-400 transition-all border-2 border-white/20 text-sm"
              >
                Explore
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid - same card style as ShowcasePage, dense */}
      <div className="flex-1 min-h-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-3 overflow-hidden flex flex-col">
        <div className="text-center mb-2 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Student Features</h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto">
            Everything students need to learn financial literacy and real-world skills through engaging gameplay.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 flex-1 min-h-0 content-start">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-3 hover:shadow-lg transition-all flex flex-col"
              >
                <div className={`${feature.iconBg} w-10 h-10 rounded-lg flex items-center justify-center mb-2 flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{feature.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 flex-1 min-h-0">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* For Teachers & Schools - same card style, compact */}
        <div className="mt-3 pt-3 border-t border-gray-200 flex-shrink-0">
          <div className="text-center mb-2">
            <h2 className="text-base font-bold text-gray-900">For Teachers & Schools</h2>
            <p className="text-xs text-gray-600">
              Full control over your classroom economy. Multi-tenant by school; super admins manage multiple schools.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 hover:shadow-lg transition-all">
              <div className="bg-primary-100 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                <UserCog className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Teacher Tools</h3>
              <p className="text-xs text-gray-600 line-clamp-2">
                Approve students, balances, salaries & tax, loans & land, tenders, Winkel, Pizza Time, disasters, suggestions, CSV export, reset.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 hover:shadow-lg transition-all">
              <div className="bg-primary-100 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                <School className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Multi-School & Analytics</h3>
              <p className="text-xs text-gray-600 line-clamp-2">
                Super admins create schools and teachers, system-wide analytics, archive schools. Enable/disable plugins. Track engagement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 bg-gray-900 text-gray-400 py-2 text-center text-xs">
        CivicLab — Teaching Financial Literacy ·{' '}
        <a
          href="https://www.katalystlabs.co.za"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 underline"
        >
          Katalyst Labs
        </a>
      </footer>
    </div>
  );
};

export default ShowcasePage2;
