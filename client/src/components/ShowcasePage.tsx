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
  LogIn
} from 'lucide-react';

const ShowcasePage: React.FC = () => {
  const features = [
    {
      icon: Wallet,
      title: 'Virtual Bank Account',
      description: 'Track your balance, view transaction history, and manage your money in a safe virtual environment.',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: Users,
      title: 'Peer-to-Peer Transfers',
      description: 'Send money to classmates easily. Learn about digital payments and financial transactions.',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      icon: Briefcase,
      title: 'Jobs & Salaries',
      description: 'Apply for jobs, earn regular salaries, and learn about work and income in a fun way.',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      icon: Home,
      title: 'Property Ownership',
      description: 'Buy land parcels, build your property portfolio, and watch your investments grow.',
      color: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    {
      icon: TrendingUp,
      title: 'Loans & Financial Planning',
      description: 'Apply for loans, learn about repayment, and understand responsible borrowing.',
      color: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    },
    {
      icon: FileText,
      title: 'Tenders & Contracts',
      description: 'Bid on town projects, complete contracts, and earn rewards for your contributions.',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      icon: Calculator,
      title: 'Math Challenges',
      description: 'Play interactive math games to earn money while practicing your skills.',
      color: 'from-pink-500 to-pink-600',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600'
    },
    {
      icon: Trophy,
      title: 'Leaderboards',
      description: 'Compete with classmates and see who\'s leading in math challenges and achievements.',
      color: 'from-yellow-500 to-yellow-600',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      icon: ShoppingCart,
      title: 'Shop & Customization',
      description: 'Buy items from the Winkel shop and customize your profile with emojis and accessories.',
      color: 'from-teal-500 to-teal-600',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600'
    },
    {
      icon: Pizza,
      title: 'Pizza Time',
      description: 'Contribute to class goals, work together, and celebrate achievements as a team.',
      color: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    {
      icon: Building2,
      title: 'Town Government',
      description: 'Learn about civic responsibility, town treasury, taxes, and how communities work together.',
      color: 'from-gray-500 to-gray-600',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600'
    },
    {
      icon: Newspaper,
      title: 'News & Announcements',
      description: 'Stay updated with town news, important announcements, and community updates.',
      color: 'from-cyan-500 to-cyan-600',
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600'
    },
    {
      icon: AlertTriangle,
      title: 'Disasters & Challenges',
      description: 'Face unexpected events that teach resilience and financial planning under pressure.',
      color: 'from-rose-500 to-rose-600',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600'
    },
    {
      icon: Lightbulb,
      title: 'Suggestions & Feedback',
      description: 'Share ideas, report bugs, and contribute to making the town better for everyone.',
      color: 'from-violet-500 to-violet-600',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              🎮 Game of Life Classroom Simulation
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-primary-100">
              Learn Financial Literacy Through Interactive Play
            </p>
            <p className="text-lg md:text-xl mb-8 text-primary-200 max-w-3xl mx-auto">
              A comprehensive town economy simulator designed for Grade 6 students. 
              Master money management, banking, jobs, and civic responsibility in a safe, engaging virtual environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-all transform hover:scale-105 shadow-lg"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Get Started
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-400 transition-all transform hover:scale-105 border-2 border-white/20"
              >
                Explore Features
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Student Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything students need to learn financial literacy, civic responsibility, and real-world skills through engaging gameplay.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className={`${feature.iconBg} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`h-7 w-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to get started on your financial literacy journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-700">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Register & Get Approved</h3>
              <p className="text-gray-600">
                Students register with their class information. Teachers approve accounts to ensure a safe learning environment.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-700">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Receive Your Bank Account</h3>
              <p className="text-gray-600">
                Once approved, you get a virtual bank account and can start participating in the town economy.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-700">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start Playing & Learning</h3>
              <p className="text-gray-600">
                Apply for jobs, buy property, participate in tenders, and learn financial skills through interactive activities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Students Love It
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="text-lg font-bold mb-2">Real-World Skills</h3>
              <p className="text-primary-100">
                Learn banking, budgeting, and financial planning in a safe environment
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-lg font-bold mb-2">Interactive Learning</h3>
              <p className="text-primary-100">
                Hands-on experience with money management and economic concepts
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-lg font-bold mb-2">Social & Collaborative</h3>
              <p className="text-primary-100">
                Work with classmates, compete on leaderboards, and achieve goals together
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-lg font-bold mb-2">Gamified Experience</h3>
              <p className="text-primary-100">
                Earn rewards, unlock achievements, and have fun while learning
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join your classmates in the virtual town and begin your financial literacy journey today.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg text-lg"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Get Started Now
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            Game of Life Classroom Simulation — Teaching Financial Literacy Through Interactive Play
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ShowcasePage;
