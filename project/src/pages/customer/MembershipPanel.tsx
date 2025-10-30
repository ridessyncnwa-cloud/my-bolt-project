import { useAuth } from '../../contexts/AuthContext';
import { Award, Check, Zap, Crown, Sparkles } from 'lucide-react';

export function MembershipPanel() {
  const { profile } = useAuth();

  const currentTier = profile?.membership_tier || 'sync_basic';

  const tiers = [
    {
      id: 'sync_basic',
      name: 'Sync Basic',
      price: 0,
      description: 'Free verified account',
      features: [
        'Free forever membership',
        '$0.75/min solo ride rate',
        'Group rides with verified members',
        'Basic ride matching',
        'Safe, verified network',
      ],
      icon: Award,
      color: 'gray',
      gradient: 'from-gray-50 to-gray-100',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      id: 'sync_gold',
      name: 'Sync Gold',
      price: 5,
      description: 'Discounts & rewards',
      features: [
        '$5/month membership',
        '$0.65/min solo ride rate',
        'Group ride discounts',
        'Referral bonuses',
        'Priority ride matching',
      ],
      icon: Zap,
      color: 'yellow',
      gradient: 'from-yellow-50 to-amber-100',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
    },
    {
      id: 'sync_diamond',
      name: 'Sync Diamond',
      price: 10,
      description: 'Maximum savings & benefits',
      features: [
        '$10/month membership',
        '$0.55/min solo ride rate',
        'Best group ride rates',
        'Maximum referral rewards',
        'Premium customer support',
      ],
      icon: Crown,
      color: 'slate',
      gradient: 'from-slate-200 to-slate-300',
      buttonColor: 'bg-slate-600 hover:bg-slate-700',
      badge: 'Best Value',
    },
  ];

  return (
    <div className="w-full">
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isCurrentTier = currentTier === tier.id;

          return (
            <div
              key={tier.id}
              className={`relative bg-gradient-to-br ${tier.gradient} rounded-2xl p-6 border-2 ${
                isCurrentTier ? `border-${tier.color}-500` : 'border-transparent'
              } transition-all hover:shadow-xl`}
            >
              {tier.badge && (
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {tier.badge}
                </div>
              )}

              {isCurrentTier && (
                <div className={`absolute -top-3 left-4 bg-${tier.color}-600 text-white px-3 py-1 rounded-full text-xs font-bold`}>
                  Current Plan
                </div>
              )}

              <div className="text-center mb-6">
                <Icon className={`w-12 h-12 text-${tier.color}-600 mx-auto mb-3`} />
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{tier.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className={`w-5 h-5 text-${tier.color}-600 mr-2 mt-0.5 flex-shrink-0`} />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {!isCurrentTier && (
                <button
                  className={`w-full ${tier.buttonColor} text-white py-3 rounded-full font-semibold transition-colors`}
                >
                  {tier.price === 0 ? 'Current Plan' : `Upgrade to ${tier.name}`}
                </button>
              )}

              {isCurrentTier && tier.price > 0 && (
                <div className="w-full bg-green-100 text-green-800 py-3 rounded-full font-semibold text-center">
                  Active
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-slate-200 shadow-lg">
        {/* Group Ride Discounts */}
        <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
          <h5 className="font-bold text-gray-800 text-lg mb-4 text-center">Group Ride Discounts</h5>
          <p className="text-sm text-gray-600 mb-4 text-center">
            Each member pays their own tier rate! Invite friends via SMS and everyone gets charged based on their membership level.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Sync Basic Group Rates */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h6 className="font-bold text-gray-700">Sync Basic Rates</h6>
                <Award className="w-5 h-5 text-gray-600" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Solo Rider (1 person)</span>
                  <span className="font-bold text-gray-700">$0.75/min</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white px-2 rounded">
                  <span className="text-gray-600">2 Riders</span>
                  <span className="font-bold text-gray-700">$0.70/min each</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white px-2 rounded">
                  <span className="text-gray-600">3 Riders</span>
                  <span className="font-bold text-green-700">$0.65/min each</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white px-2 rounded">
                  <span className="text-gray-600">4 Riders</span>
                  <span className="font-bold text-green-700">$0.60/min each</span>
                </div>
              </div>
            </div>

            {/* Sync Gold Group Discounts */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <h6 className="font-bold text-yellow-700">Sync Gold Rates</h6>
                <Zap className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Solo Rider (1 person)</span>
                  <span className="font-bold text-yellow-700">$0.65/min</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white px-2 rounded">
                  <span className="text-gray-600">2 Riders</span>
                  <span className="font-bold text-yellow-700">$0.60/min each</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white px-2 rounded">
                  <span className="text-gray-600">3 Riders</span>
                  <span className="font-bold text-green-700">$0.55/min each</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white px-2 rounded">
                  <span className="text-gray-600">4 Riders</span>
                  <span className="font-bold text-green-700">$0.50/min each</span>
                </div>
              </div>
            </div>

            {/* Sync Diamond Group Discounts */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h6 className="font-bold text-slate-700">Sync Diamond Rates</h6>
                <Crown className="w-5 h-5 text-slate-600" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Solo Rider (1 person)</span>
                  <span className="font-bold text-slate-700">$0.55/min</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white px-2 rounded">
                  <span className="text-gray-600">2 Riders</span>
                  <span className="font-bold text-slate-700">$0.50/min each</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white px-2 rounded">
                  <span className="text-gray-600">3 Riders</span>
                  <span className="font-bold text-green-700">$0.45/min each</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-white px-2 rounded">
                  <span className="text-gray-600">4 Riders</span>
                  <span className="font-bold text-green-700">$0.40/min each</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 text-center">
              Each member pays based on their own membership tier. Sync Basic and Sync Gold members still pay platform fees!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
