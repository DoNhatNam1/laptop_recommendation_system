import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Laptop, Zap, Target, ThumbsUp, ArrowRight } from 'lucide-react'

function Welcome() {
  const navigate = useNavigate()
  const [showMainContent, setShowMainContent] = useState(false)

  useEffect(() => {
    localStorage.clear()
    // Xóa tất cả dữ liệu trong localStorage khi vào trang này
  }, [])
  

  useEffect(() => {
    // Hiển thị nội dung chính sau hiệu ứng logo
    const timer = setTimeout(() => {
      setShowMainContent(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Animation variants cho các phần tử
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  const laptopVariants = {
    initial: { scale: 0.8, rotate: -5, opacity: 0 },
    animate: { 
      scale: 1, 
      rotate: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        duration: 0.8 
      }
    }
  }

  const featureCardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: (custom: number) => ({
      y: 0,
      opacity: 1,
      transition: { 
        delay: 0.6 + custom * 0.2,
        duration: 0.5
      }
    })
  }

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-blue-500" />,
      title: "Nhanh chóng & Chính xác",
      description: "Tìm laptop phù hợp trong vài phút dựa trên nhu cầu thực tế"
    },
    {
      icon: <Target className="w-8 h-8 text-purple-500" />,
      title: "Tùy chỉnh cao",
      description: "Phân tích chi tiết các tiêu chí quan trọng với từng người dùng"
    },
    {
      icon: <ThumbsUp className="w-8 h-8 text-green-500" />,
      title: "Kết quả tin cậy",
      description: "Sử dụng phương pháp phân tích thứ bậc AHP cho kết quả khách quan"
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-blue-50 to-white">
      {/* Initial logo animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: showMainContent ? 0.8 : 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute flex items-center justify-center mb-16 transform -translate-y-1/2 top-1/2"
        style={{ display: showMainContent ? 'none' : 'flex' }}
      >
        <motion.div
          animate={{ 
            rotateY: [0, 360],
            transition: { duration: 1.5, ease: "easeInOut" }
          }}
        >
          <div className="p-6 text-white bg-blue-600 rounded-full">
            <Laptop className="w-20 h-20" />
          </div>
        </motion.div>
      </motion.div>

      {/* Main content */}
      {showMainContent && (
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="flex justify-center"
            variants={laptopVariants}
            initial="initial"
            animate="animate"
          >
            <div className="p-5 mb-6 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <Laptop className="w-16 h-16 text-white" />
            </div>
          </motion.div>

          <motion.h1 
            className="mb-4 text-4xl font-bold text-transparent md:text-5xl bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
            variants={itemVariants}
          >
            Hệ Thống Gợi Ý Laptop Thông Minh
          </motion.h1>

          <motion.p 
            className="max-w-2xl mx-auto mb-8 text-xl text-gray-600"
            variants={itemVariants}
          >
            Tìm chiếc laptop hoàn hảo cho nhu cầu của bạn dựa trên phân tích đa tiêu chí và công nghệ AI tiên tiến.
          </motion.p>

          <motion.div className="grid gap-6 mb-10 md:grid-cols-3" variants={containerVariants}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={featureCardVariants}
                className="p-6 transition-shadow bg-white shadow-md rounded-xl hover:shadow-lg"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button 
              onClick={() => navigate('/usage')}
              size="lg" 
              className="px-8 py-6 text-lg rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <span>Bắt đầu ngay</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          <motion.div 
            className="mt-16 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <p>© 2025 Hệ thống gợi ý laptop thông minh. Tất cả quyền được bảo lưu.</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Welcome