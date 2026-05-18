import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

const FinishScreen: React.FC = () => {
    const [showLogo, setShowLogo] = useState(false);
    const [showTagline, setShowTagline] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer1 = setTimeout(() => setShowLogo(true), 300);
        const timer2 = setTimeout(() => setShowTagline(true), 1000);
        const timer3 = setTimeout(() => setShowContent(true), 1500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    return (
        <div>
            <div className="text-center max-w-2xl mx-auto">
                {/* Animated Logo */}
                <div className={`transition-all duration-1000 ${showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#f490f8] to-[#b430cc] rounded-3xl mb-8 relative overflow-hidden">
                        <Zap className="w-12 h-12 text-white animate-pulse" />
                        <div className="absolute inset-0 bg-gradient-to-br from-[#f490f8]/20 to-[#b430cc]/20 animate-pulse" />
                    </div>
                </div>

                {/* Logo Text */}
                <div className={`transition-all duration-1000 delay-300 ${showLogo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                        <span className="bg-gradient-to-r from-[#f490f8] to-[#b430cc] bg-clip-text text-transparent">
                            Loophack
                        </span>
                    </h1>
                </div>

                {/* Tagline */}
                <div className={`transition-all duration-1000 delay-500 ${showTagline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <p className="text-xl md:text-2xl text-white/80 mb-12">
                        Build smarter agents. Unlock real-world results.
                    </p>
                </div>

                {/* Content */}
                <div className={`transition-all duration-1000 delay-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="bg-[#340349]/50 backdrop-blur-sm border border-[#f490f8]/20 rounded-xl p-8 mb-8">
                        <div className="flex items-center justify-center mb-6">
                            <CheckCircle className="w-16 h-16 text-green-400 animate-bounce" />
                        </div>

                        <h2 className="text-2xl font-semibold text-white mb-4">Loop Successfully Deployed!</h2>
                        <p className="text-white/70 mb-6">
                            Your AI strategy loop has been activated and is now running. Monitor its performance in the dashboard.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-[#1a0a2e]/50 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-[#f490f8]" />
                                    <span className="text-white/70 text-sm">Trigger</span>
                                </div>
                                <p className="text-white font-medium">Active</p>
                            </div>

                            <div className="bg-[#1a0a2e]/50 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-[#f490f8]" />
                                    <span className="text-white/70 text-sm">Tasks</span>
                                </div>
                                <p className="text-white font-medium">Running</p>
                            </div>

                            <div className="bg-[#1a0a2e]/50 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-[#f490f8]" />
                                    <span className="text-white/70 text-sm">Incentives</span>
                                </div>
                                <p className="text-white font-medium">Deployed</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button className="w-full bg-gradient-to-r from-[#f490f8] to-[#b430cc] text-white py-4 px-6 rounded-lg font-medium hover:shadow-lg hover:shadow-[#f490f8]/30 transition-all duration-300 flex items-center justify-center space-x-2 group">
                            <span>View Dashboard</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                        </button>

                        <button className="w-full bg-[#1a0a2e] border border-[#f490f8]/20 text-white py-4 px-6 rounded-lg font-medium hover:bg-[#f490f8]/10 transition-colors duration-200">
                            Create Another Loop
                        </button>
                    </div>
                </div>

                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-[#f490f8] rounded-full animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinishScreen;