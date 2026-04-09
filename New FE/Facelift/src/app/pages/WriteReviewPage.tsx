import { useState } from 'react';
import { useNavigate } from 'react-router';
import { StepProgress } from '../components/StepProgress';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const categories = [
  'Landlord Responsiveness',
  'Maintenance',
  'Value for Money',
  'Cleanliness',
  'Location',
  'Safety',
  'Amenities',
];

export function WriteReviewPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1 - Verify Tenancy
  const [address, setAddress] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [moveOutDate, setMoveOutDate] = useState('');

  // Step 2 - Rate Categories
  const [ratings, setRatings] = useState<Record<string, number>>({
    'Landlord Responsiveness': 5,
    'Maintenance': 5,
    'Value for Money': 5,
    'Cleanliness': 5,
    'Location': 5,
    'Safety': 5,
    'Amenities': 5,
  });

  // Step 3 - Write Review
  const [reviewText, setReviewText] = useState('');
  const [tenantFit, setTenantFit] = useState('');

  const handleNext = () => {
    if (currentStep < 4) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // In a real app, submit to backend
    setDirection(1);
    setCurrentStep(4);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-6">
        {currentStep < 4 && (
          <StepProgress
            currentStep={currentStep}
            totalSteps={3}
            steps={['Verify Tenancy', 'Rate Categories', 'Write Review']}
          />
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 1 - Verify Tenancy */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white border border-[#E2DDD6] rounded-[16px] p-8"
            >
              <h2 className="text-3xl font-['Lora'] font-bold text-[#0F1F38] mb-2">
                Verify Your Tenancy
              </h2>
              <p className="text-[#717182] mb-8">
                Help us maintain trust by verifying your rental history
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#0F1F38] mb-2">
                    Property Address *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="142 Oak Street, Unit 3B"
                    className="w-full px-4 py-3 border border-[#E2DDD6] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#E8913A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0F1F38] mb-2">
                      Move-in Date *
                    </label>
                    <input
                      type="date"
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E2DDD6] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#E8913A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0F1F38] mb-2">
                      Move-out Date
                    </label>
                    <input
                      type="date"
                      value={moveOutDate}
                      onChange={(e) => setMoveOutDate(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E2DDD6] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#E8913A]"
                    />
                  </div>
                </div>

                <div className="bg-[#F7F4EF] border border-[#E2DDD6] rounded-[12px] p-4">
                  <p className="text-sm text-[#0F1F38]">
                    <strong>Privacy note:</strong> Your review will be verified but your personal information will remain confidential.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={handleNext}
                  disabled={!address || !moveInDate}
                  className="bg-[#E8913A] hover:bg-[#d17f2f] disabled:bg-[#E2DDD6] disabled:cursor-not-allowed text-white px-8 py-3 rounded-[12px] font-semibold flex items-center gap-2 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2 - Rate Categories */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white border border-[#E2DDD6] rounded-[16px] p-8"
            >
              <h2 className="text-3xl font-['Lora'] font-bold text-[#0F1F38] mb-2">
                Rate Your Experience
              </h2>
              <p className="text-[#717182] mb-8">
                Rate each category from 1 (poor) to 10 (excellent)
              </p>

              <div className="space-y-6">
                {categories.map((category) => (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-[#0F1F38]">
                        {category}
                      </label>
                      <span className="text-2xl font-['Lora'] font-semibold text-[#E8913A]">
                        {ratings[category].toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={ratings[category]}
                      onChange={(e) => setRatings({ ...ratings, [category]: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-[#E2DDD6] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-[#E8913A] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#717182] mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-4 mt-8">
                <button
                  onClick={handleBack}
                  className="border border-[#E2DDD6] hover:border-[#0F1F38] text-[#0F1F38] px-8 py-3 rounded-[12px] font-semibold flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="bg-[#E8913A] hover:bg-[#d17f2f] text-white px-8 py-3 rounded-[12px] font-semibold flex items-center gap-2 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3 - Write Review */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white border border-[#E2DDD6] rounded-[16px] p-8"
            >
              <h2 className="text-3xl font-['Lora'] font-bold text-[#0F1F38] mb-2">
                Share Your Story
              </h2>
              <p className="text-[#717182] mb-8">
                Help future renters understand what it's like to live here
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#0F1F38] mb-2">
                    Your Review *
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience living at this property. What did you like? What could be improved?"
                    rows={8}
                    className="w-full px-4 py-3 border border-[#E2DDD6] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#E8913A] resize-none"
                  />
                  <p className="text-sm text-[#717182] mt-2">
                    {reviewText.length} / 1000 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0F1F38] mb-2">
                    Who is this property best suited for?
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {['Young Professional', 'Family', 'Student', 'Retiree', 'Pet Owner'].map((fit) => (
                      <button
                        key={fit}
                        onClick={() => setTenantFit(fit)}
                        className={`px-4 py-2 rounded-full transition-colors ${
                          tenantFit === fit
                            ? 'bg-[#E8913A] text-white'
                            : 'bg-white border border-[#E2DDD6] text-[#0F1F38] hover:border-[#E8913A]'
                        }`}
                      >
                        {fit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-4 mt-8">
                <button
                  onClick={handleBack}
                  className="border border-[#E2DDD6] hover:border-[#0F1F38] text-[#0F1F38] px-8 py-3 rounded-[12px] font-semibold flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!reviewText || reviewText.length < 50}
                  className="bg-[#E8913A] hover:bg-[#d17f2f] disabled:bg-[#E2DDD6] disabled:cursor-not-allowed text-white px-8 py-3 rounded-[12px] font-semibold transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4 - Confirmation */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white border border-[#E2DDD6] rounded-[16px] p-12 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-['Lora'] font-bold text-[#0F1F38] mb-4">
                Review Submitted!
              </h2>
              <p className="text-[#717182] mb-8 max-w-md mx-auto">
                Thank you for sharing your experience. Your review is being verified and will be published within 24 hours.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="border border-[#E2DDD6] hover:border-[#0F1F38] text-[#0F1F38] px-6 py-3 rounded-[12px] font-semibold transition-colors"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-[#E8913A] hover:bg-[#d17f2f] text-white px-6 py-3 rounded-[12px] font-semibold transition-colors"
                >
                  View My Reviews
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
