import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { LaptopIcon, GamepadIcon, PlaneIcon, ChevronRight } from 'lucide-react'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
}

// Background decorations
const BackgroundDecorations = () => (
  <div className="absolute inset-0 overflow-hidden -z-10">
    {/* Top left decorative circle */}
    <div className="absolute top-0 left-0 rounded-full w-80 h-80 bg-gradient-to-br from-blue-200 to-blue-400 filter blur-3xl opacity-20 -translate-y-1/3 -translate-x-1/3"></div>
    
    {/* Bottom right decorative blob */}
    <div className="absolute bottom-0 right-0 rounded-full w-96 h-96 bg-gradient-to-tr from-purple-200 to-purple-400 filter blur-3xl opacity-20 translate-y-1/3 translate-x-1/3"></div>
    
    {/* Floating laptop elements */}
    <div className="absolute top-[20%] right-[10%] text-gray-200 opacity-20 animate-float hidden lg:block">
      <LaptopIcon size={60} />
    </div>
    <div className="absolute bottom-[25%] left-[8%] text-gray-200 opacity-20 animate-float-delay hidden lg:block">
      <GamepadIcon size={45} />
    </div>
    <div className="absolute top-[60%] right-[15%] text-gray-200 opacity-20 animate-float-slow hidden lg:block">
      <PlaneIcon size={40} />
    </div>
    
    {/* Grid pattern background */}
    <div className="absolute inset-0 bg-grid-slate-100/[0.05] bg-[length:20px_20px]"></div>
  </div>
)

// Define usage options with icon and description
const usageOptions = [
  {
    id: 'office',
    title: 'Học tập & Văn phòng',
    description: 'Phù hợp cho công việc văn phòng, học tập và giải trí nhẹ nhàng',
    icon: <LaptopIcon className="w-10 h-10 text-white" />,
    gradient: 'from-blue-400 to-blue-600',
    bgLight: 'bg-blue-50'
  },
  {
    id: 'gaming',
    title: 'Gaming & Đồ họa',
    description: 'Hiệu năng mạnh mẽ cho game và các phần mềm đồ họa nặng',
    icon: <GamepadIcon className="w-10 h-10 text-white" />,
    gradient: 'from-green-400 to-green-600',
    bgLight: 'bg-green-50'
  },
  {
    id: 'mobility',
    title: 'Di chuyển nhiều',
    description: 'Nhẹ, mỏng, thời lượng pin tốt cho người thường xuyên di chuyển',
    icon: <PlaneIcon className="w-10 h-10 text-white" />,
    gradient: 'from-purple-400 to-purple-600',
    bgLight: 'bg-purple-50'
  },
]

function UsageSelection() {
  const [usage, setUsage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!usage) return
    
    // Add animation before navigation
    setIsSubmitting(true)
    setTimeout(() => {
      navigate('/criteria', { state: { usage } })
    }, 700)
  }

  return (
    <motion.div 
      className="relative min-h-screen px-4 py-12 overflow-hidden bg-gradient-to-b from-slate-50 to-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <BackgroundDecorations />
      
      <div className="max-w-2xl mx-auto">
        <motion.div
          variants={itemVariants}
          className="mb-8 text-center"
        >
          <h1 className="mb-3 text-3xl font-bold text-gray-800">Bước 1: Mục đích sử dụng</h1>
          <p className="max-w-lg mx-auto text-slate-600">
            Chọn mục đích chính khi sử dụng laptop để chúng tôi có thể đưa ra gợi ý phù hợp nhất với nhu cầu của bạn.
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500"></div>
            <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-gray-300"></div>
            <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-gray-300"></div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-2xl font-bold text-center text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                Chọn mục đích sử dụng
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                <RadioGroup
                  value={usage}
                  onValueChange={setUsage}
                  className="gap-5"
                >
                  {usageOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: usageOptions.findIndex(o => o.id === option.id) * 0.1 + 0.3 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    >
                      <div
                        className={`
                          relative overflow-hidden rounded-xl border-2 transition-all duration-300
                          ${usage === option.id ? `border-${option.gradient.split(' ')[0].substring(5)} ${option.bgLight}` : 'border-gray-200 hover:border-gray-300'}
                        `}
                      >
                        {/* Background pattern when selected */}
                        {usage === option.id && (
                          <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <defs>
                                <pattern id={`pattern-${option.id}`} patternUnits="userSpaceOnUse" width="25" height="25" patternTransform="rotate(30)">
                                  <rect x="0" y="0" width="100%" height="100%" fill="none" />
                                  <path d="M-5,0 L10,15 M-5,25 L25,0 M15,25 L25,10" strokeWidth="1" shapeRendering="auto" stroke="currentColor" strokeLinecap="round" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill={`url(#pattern-${option.id})`} />
                            </svg>
                          </div>
                        )}
                        
                        <div className="relative z-10 flex items-center p-4 space-x-4">
                          <RadioGroupItem value={option.id} id={option.id} className="w-5 h-5" />
                          <div className="flex items-center flex-1 space-x-4">
                            <div className={`flex items-center justify-center p-3 rounded-lg bg-gradient-to-br ${option.gradient} shadow-md text-white`}>
                              {option.icon}
                            </div>
                            <Label
                              htmlFor={option.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="text-lg font-semibold text-gray-800">{option.title}</div>
                              <div className="text-sm text-gray-500">{option.description}</div>
                            </Label>
                            
                            {/* Selection effect */}
                            {usage === option.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`w-8 h-8 rounded-full bg-gradient-to-br ${option.gradient} flex items-center justify-center text-white`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </RadioGroup>
                
                <motion.div 
                  className="flex justify-end mt-8"
                  variants={itemVariants}
                >
                  <Button 
                    type="submit" 
                    disabled={!usage || isSubmitting}
                    className={`gap-2 ${usage ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        Tiếp tục
                        <ChevronRight size={16} />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default UsageSelection