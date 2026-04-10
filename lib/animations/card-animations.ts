
import { Variants } from "motion/react";




const animationVariants: Record<string, any> = {
  
  bounce: {
    style: { originX: 0.5, originY: 1 },
    initial: { y: 0, scaleY: 1 },
    animate: {
      y: [0, -30, 0, -15, 0, -4, 0],
      scaleY: [1, 1.1, 1, 1.05, 0.95, 1.02, 1],
      transition: {
        duration: 1,
        times: [0, 0.2, 0.4, 0.43, 0.53, 0.7, 0.8, 0.9, 1],
        ease: [0.215, 0.61, 0.355, 1],
      }
    }
  },

  flash: {
    initial: { opacity: 1 },
    animate: {
      opacity: [1, 0, 1, 0, 1],
      transition: {
        duration: 1,
        times: [0, 0.25, 0.5, 0.75, 1],
        ease: "linear"
      }
    }
  },

  pulse: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1,
        ease: "easeInOut",
        repeat: Infinity
      }
    }
  },

  pulseCelebration: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      }
    }
  },

  rubberBand: {
    initial: { scaleX: 1, scaleY: 1 },
    animate: {
      scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
      scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
      transition: {
        duration: 1,
        times: [0, 0.3, 0.4, 0.5, 0.65, 0.75, 1]
      }
    }
  },

  shakeX: {
    initial: { x: 0 },
    animate: {
      x: [0, -10, 10, -10, 10, -10, 10, -10, 10, 0],
      transition: {
        duration: 1,
        times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
      }
    }
  },

  shakeY: {
    initial: { y: 0 },
    animate: {
      y: [0, -10, 10, -10, 10, -10, 10, -10, 10, 0],
      transition: {
        duration: 1,
        times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
      }
    }
  },

  headShake: {
    initial: { x: 0, rotateY: 0 },
    animate: {
      x: [0, -6, 5, -3, 2, 0],
      rotateY: [0, -9, 7, -5, 3, 0],
      transition: {
        duration: 1,
        times: [0, 0.065, 0.185, 0.315, 0.435, 0.5, 1],
        ease: "easeInOut"
      }
    }
  },

  swing: {
    style: { originX: 0.5, originY: 0 },
    initial: { rotate: 0 },
    animate: {
      rotate: [0, 15, -10, 5, -5, 0],
      transition: {
        duration: 1,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      }
    }
  },

  tada: {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 0.9, 0.9, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1],
      rotate: [0, -3, -3, 3, -3, 3, -3, 3, -3, 0],
      transition: {
        duration: 1,
        times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
      }
    }
  },

  wobble: {
    initial: { x: 0, rotate: 0 },
    animate: {
      x: [0, "-25%", "20%", "-15%", "10%", "-5%", 0],
      rotate: [0, -5, 3, -3, 2, -1, 0],
      transition: {
        duration: 1,
        times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1]
      }
    }
  },

  jello: {
    style: { originX: 0.5, originY: 0.5 },
    initial: { skewX: 0, skewY: 0 },
    animate: {
      skewX: [0, -12.5, 6.25, -3.125, 1.5625, -0.78125, 0.390625, -0.1953125, 0],
      skewY: [0, -12.5, 6.25, -3.125, 1.5625, -0.78125, 0.390625, -0.1953125, 0],
      transition: {
        duration: 1,
        times: [0, 0.111, 0.222, 0.333, 0.444, 0.555, 0.666, 0.777, 0.888, 1],
      }
    }
  },

  heartBeat: {
    initial: {
      scale: 1
    },
    animate: {
      scale: [1, 1.3, 1, 1.3, 1],
      transition: {
        duration: 1.3,
        times: [0, 0.14, 0.28, 0.42, 0.7], 
        ease: "easeInOut"
      }
    }
  },

  
  backInDown: {
    initial: { y: -1200, scale: 0.7, opacity: 0.7 },
    animate: {
      y: [0, 0],
      scale: [0.7, 1],
      opacity: [0.7, 1],
      transition: {
        duration: 1,
        times: [0, 0.8, 1]
      }
    }
  },

  backInLeft: {
    initial: { x: -2000, scale: 0.7, opacity: 0.7 },
    animate: {
      x: [0, 0],
      scale: [0.7, 1],
      opacity: [0.7, 1],
      transition: {
        duration: 1,
        times: [0, 0.8, 1]
      }
    }
  },

  backInRight: {
    initial: { x: 2000, scale: 0.7, opacity: 0.7 },
    animate: {
      x: [0, 0],
      scale: [0.7, 1],
      opacity: [0.7, 1],
      transition: {
        duration: 1,
        times: [0, 0.8, 1]
      }
    }
  },

  backInUp: {
    initial: { y: 1200, scale: 0.7, opacity: 0.7 },
    animate: {
      y: [0, 0],
      scale: [0.7, 1],
      opacity: [0.7, 1],
      transition: {
        duration: 1,
        times: [0, 0.8, 1]
      }
    }
  },

  
  backOutDown: {
    initial: { scale: 1, opacity: 1 },
    animate: {
      y: [0, 0, 700],
      scale: [1, 0.7, 0.7],
      opacity: [1, 0.7, 0.7],
      transition: {
        duration: 1,
        times: [0, 0.2, 1]
      }
    }
  },

  backOutLeft: {
    initial: { scale: 1, opacity: 1 },
    animate: {
      x: [0, 0, -2000],
      scale: [1, 0.7, 0.7],
      opacity: [1, 0.7, 0.7],
      transition: {
        duration: 1,
        times: [0, 0.2, 1]
      }
    }
  },

  backOutRight: {
    initial: { scale: 1, opacity: 1 },
    animate: {
      x: [0, 0, 2000],
      scale: [1, 0.7, 0.7],
      opacity: [1, 0.7, 0.7],
      transition: {
        duration: 1,
        times: [0, 0.2, 1]
      }
    }
  },

  backOutUp: {
    initial: { scale: 1, opacity: 1 },
    animate: {
      y: [0, 0, -700],
      scale: [1, 0.7, 0.7],
      opacity: [1, 0.7, 0.7],
      transition: {
        duration: 1,
        times: [0, 0.2, 1]
      }
    }
  },

  
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: {
      opacity: [0, 0, 0, 1, 1, 1],
      scale: [0.3, 1.1, 0.9, 1.03, 0.97, 1],
      transition: {
        duration: 0.75,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        ease: [0.215, 0.61, 0.355, 1]
      }
    }
  },

  bounceInDown: {
    initial: { opacity: 0, y: -3000, scaleY: 3 },
    animate: {
      opacity: [0, 1, 1, 1, 1],
      y: [-3000, 25, -10, 5, 0],
      scaleY: [3, 0.9, 0.95, 0.985, 1],
      transition: {
        duration: 1,
        times: [0, 0.6, 0.75, 0.9, 1],
        ease: [0.215, 0.61, 0.355, 1]
      }
    }
  },

  bounceInLeft: {
    initial: { opacity: 0, x: -3000, scaleX: 3 },
    animate: {
      opacity: [0, 1, 1, 1, 1],
      x: [-3000, 25, -10, 5, 0],
      scaleX: [3, 1, 0.98, 0.995, 1],
      transition: {
        duration: 1,
        times: [0, 0.6, 0.75, 0.9, 1],
        ease: [0.215, 0.61, 0.355, 1]
      }
    }
  },

  bounceInRight: {
    initial: { opacity: 0, x: 3000, scaleX: 3 },
    animate: {
      opacity: [0, 1, 1, 1, 1],
      x: [3000, -25, 10, -5, 0],
      scaleX: [3, 1, 0.98, 0.995, 1],
      transition: {
        duration: 1,
        times: [0, 0.6, 0.75, 0.9, 1],
        ease: [0.215, 0.61, 0.355, 1]
      }
    }
  },

  bounceInUp: {
    initial: { opacity: 0, y: 3000, scaleY: 5 },
    animate: {
      opacity: [0, 1, 1, 1, 1],
      y: [3000, -20, 10, -5, 0],
      scaleY: [5, 0.9, 0.95, 0.985, 1],
      transition: {
        duration: 1,
        times: [0, 0.6, 0.75, 0.9, 1],
        ease: [0.215, 0.61, 0.355, 1]
      }
    }
  },

  
  bounceOut: {
    initial: { scale: 1, opacity: 1 },
    animate: {
      scale: [1, 0.9, 1.1, 1.1, 0.3],
      opacity: [1, 1, 1, 1, 0],
      transition: {
        duration: 0.75,
        times: [0, 0.2, 0.5, 0.55, 1]
      }
    }
  },

  bounceOutDown: {
    initial: { y: 0, scaleY: 1, opacity: 1 },
    animate: {
      y: [0, 10, -20, 2000],
      scaleY: [1, 0.985, 0.9, 3],
      opacity: [1, 1, 1, 0],
      transition: {
        duration: 1,
        times: [0, 0.2, 0.4, 0.45, 1]
      }
    }
  },

  bounceOutLeft: {
    initial: { x: 0, scaleX: 1, opacity: 1 },
    animate: {
      x: [0, 20, -2000],
      scaleX: [1, 0.9, 2],
      opacity: [1, 1, 0],
      transition: {
        duration: 1,
        times: [0, 0.2, 1]
      }
    }
  },

  bounceOutRight: {
    initial: { x: 0, scaleX: 1, opacity: 1 },
    animate: {
      x: [0, -20, 2000],
      scaleX: [1, 0.9, 2],
      opacity: [1, 1, 0],
      transition: {
        duration: 1,
        times: [0, 0.2, 1]
      }
    }
  },

  bounceOutUp: {
    initial: { y: 0, scaleY: 1, opacity: 1 },
    animate: {
      y: [0, -10, 20, -2000],
      scaleY: [1, 0.985, 0.9, 3],
      opacity: [1, 1, 1, 0],
      transition: {
        duration: 1,
        times: [0, 0.2, 0.4, 0.45, 1]
      }
    }
  },

  
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 }
  },

  fadeInDown: {
    initial: { opacity: 0, y: "-100%" },
    animate: { opacity: 1, y: 0 }
  },

  fadeInDownBig: {
    initial: { opacity: 0, y: -2000 },
    animate: { opacity: 1, y: 0 }
  },

  fadeInLeft: {
    initial: { opacity: 0, x: "-100%" },
    animate: { opacity: 1, x: 0 }
  },

  fadeInLeftBig: {
    initial: { opacity: 0, x: -2000 },
    animate: { opacity: 1, x: 0 }
  },

  fadeInRight: {
    initial: { opacity: 0, x: "100%" },
    animate: { opacity: 1, x: 0 }
  },

  fadeInRightBig: {
    initial: { opacity: 0, x: 2000 },
    animate: { opacity: 1, x: 0 }
  },

  fadeInUp: {
    initial: { opacity: 0, y: "100%" },
    animate: { opacity: 1, y: 0 }
  },

  fadeInUpBig: {
    initial: { opacity: 0, y: 2000 },
    animate: { opacity: 1, y: 0 }
  },

  fadeInTopLeft: {
    initial: { opacity: 0, x: "-100%", y: "-100%" },
    animate: { opacity: 1, x: 0, y: 0 }
  },

  fadeInTopRight: {
    initial: { opacity: 0, x: "100%", y: "-100%" },
    animate: { opacity: 1, x: 0, y: 0 }
  },

  fadeInBottomLeft: {
    initial: { opacity: 0, x: "-100%", y: "100%" },
    animate: { opacity: 1, x: 0, y: 0 }
  },

  fadeInBottomRight: {
    initial: { opacity: 0, x: "100%", y: "100%" },
    animate: { opacity: 1, x: 0, y: 0 }
  },

  
  fadeOut: {
    initial: { opacity: 1 },
    animate: { opacity: 0 }
  },

  fadeOutDown: {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 0, y: "100%" }
  },

  fadeOutDownBig: {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 0, y: 2000 }
  },

  fadeOutLeft: {
    initial: { opacity: 1, x: 0 },
    animate: { opacity: 0, x: "-100%" }
  },

  fadeOutLeftBig: {
    initial: { opacity: 1, x: 0 },
    animate: { opacity: 0, x: -2000 }
  },

  fadeOutRight: {
    initial: { opacity: 1, x: 0 },
    animate: { opacity: 0, x: "100%" }
  },

  fadeOutRightBig: {
    initial: { opacity: 1, x: 0 },
    animate: { opacity: 0, x: 2000 }
  },

  fadeOutUp: {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 0, y: "-100%" }
  },

  fadeOutUpBig: {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 0, y: -2000 }
  },

  fadeOutTopLeft: {
    initial: { opacity: 1, x: 0, y: 0 },
    animate: { opacity: 0, x: "-100%", y: "-100%" }
  },

  fadeOutTopRight: {
    initial: { opacity: 1, x: 0, y: 0 },
    animate: { opacity: 0, x: "100%", y: "-100%" }
  },

  fadeOutBottomLeft: {
    initial: { opacity: 1, x: 0, y: 0 },
    animate: { opacity: 0, x: "-100%", y: "100%" }
  },

  fadeOutBottomRight: {
    initial: { opacity: 1, x: 0, y: 0 },
    animate: { opacity: 0, x: "100%", y: "100%" }
  },

  
  flip: {
    initial: { rotateY: -360, scale: 1 },
    animate: {
      rotateY: [-360, -190, -170, 0, 0],
      scale: [1, 1, 1, 0.95, 1],
      z: [0, 150, 150, 0, 0],
      transition: {
        duration: 1,
        times: [0, 0.4, 0.5, 0.8, 1],
        ease: ["easeOut", "easeOut", "easeIn", "easeIn", "easeIn"]
      }
    }
  },

  flipInX: {
    initial: { rotateX: 90, opacity: 0, perspective: 400 },
    animate: {
      rotateX: [90, -20, 10, -5, 0],
      opacity: [0, 0, 1, 1, 1],
      transition: {
        duration: 1,
        times: [0, 0.4, 0.6, 0.8, 1],
        ease: ["easeIn", "easeIn", "linear", "linear", "linear"]
      }
    }
  },

  flipInY: {
    initial: { rotateY: 90, opacity: 0, perspective: 400 },
    animate: {
      rotateY: [90, -20, 10, -5, 0],
      opacity: [0, 0, 1, 1, 1],
      transition: {
        duration: 1,
        times: [0, 0.4, 0.6, 0.8, 1],
        ease: ["easeIn", "easeIn", "linear", "linear", "linear"]
      }
    }
  },

  flipOutX: {
    initial: { rotateX: 0, opacity: 1, perspective: 400 },
    animate: {
      rotateX: [0, -20, 90],
      opacity: [1, 1, 0],
      transition: {
        duration: 0.75,
        times: [0, 0.3, 1]
      }
    }
  },

  flipOutY: {
    initial: { rotateY: 0, opacity: 1, perspective: 400 },
    animate: {
      rotateY: [0, -15, 90],
      opacity: [1, 1, 0],
      transition: {
        duration: 0.75,
        times: [0, 0.3, 1]
      }
    }
  },

  
  lightSpeedInLeft: {
    initial: { x: "-100%", skewX: 30, opacity: 0 },
    animate: {
      x: ["-100%", 0, 0, 0],
      skewX: [30, -20, 5, 0],
      opacity: [0, 1, 1, 1],
      transition: {
        duration: 1,
        times: [0, 0.6, 0.8, 1],
        ease: "easeOut"
      }
    }
  },

  lightSpeedInRight: {
    initial: { x: "100%", skewX: -30, opacity: 0 },
    animate: {
      x: ["100%", 0, 0, 0],
      skewX: [-30, 20, -5, 0],
      opacity: [0, 1, 1, 1],
      transition: {
        duration: 1,
        times: [0, 0.6, 0.8, 1],
        ease: "easeOut"
      }
    }
  },

  lightSpeedOutLeft: {
    initial: { opacity: 1, x: 0, skewX: 0 },
    animate: {
      x: "-100%",
      skewX: -30,
      opacity: 0,
      transition: {
        duration: 1,
        ease: "easeIn"
      }
    }
  },

  lightSpeedOutRight: {
    initial: { opacity: 1, x: 0, skewX: 0 },
    animate: {
      x: "100%",
      skewX: 30,
      opacity: 0,
      transition: {
        duration: 1,
        ease: "easeIn"
      }
    }
  },

  
  rotateIn: {
    style: { originX: 0.5, originY: 0.5 },
    initial: { rotate: -200, opacity: 0 },
    animate: {
      rotate: 0,
      opacity: 1,
    }
  },

  rotateInDownLeft: {
    style: { originX: 0, originY: 1 },
    initial: { rotate: -45, opacity: 0 },
    animate: {
      rotate: 0,
      opacity: 1,
    }
  },

  rotateInDownRight: {
    style: { originX: 1, originY: 1 },
    initial: { rotate: 45, opacity: 0 },
    animate: {
      rotate: 0,
      opacity: 1,
    }
  },

  rotateInUpLeft: {
    style: { originX: 0, originY: 1 },
    initial: { rotate: 45, opacity: 0 },
    animate: {
      rotate: 0,
      opacity: 1,
    }
  },

  rotateInUpRight: {
    style: { originX: 1, originY: 1 },
    initial: { rotate: -90, opacity: 0 },
    animate: {
      rotate: 0,
      opacity: 1,
    }
  },

  
  rotateOut: {
    style: { originX: 0.5, originY: 0.5 },
    initial: { opacity: 1, rotate: 0 },
    animate: {
      rotate: 200,
      opacity: 0,
    }
  },

  rotateOutDownLeft: {
    style: { originX: 0, originY: 1 },
    initial: { opacity: 1, rotate: 0 },
    animate: {
      rotate: 45,
      opacity: 0,
    }
  },

  rotateOutDownRight: {
    style: { originX: 1, originY: 1 },
    initial: { opacity: 1, rotate: 0 },
    animate: {
      rotate: -45,
      opacity: 0,
    }
  },

  rotateOutUpLeft: {
    style: { originX: 0, originY: 1 },
    initial: { opacity: 1, rotate: 0 },
    animate: {
      rotate: -45,
      opacity: 0,
    }
  },

  rotateOutUpRight: {
    style: { originX: 1, originY: 1 },
    initial: { opacity: 1, rotate: 0 },
    animate: {
      rotate: 90,
      opacity: 0,
    }
  },

  
  hinge: {
    style: { originX: 0, originY: 0 },
    initial: { rotate: 0, opacity: 1 },
    animate: {
      rotate: [0, 80, 60, 80, 60, 0],
      y: [0, 0, 0, 0, 0, 700],
      opacity: [1, 1, 1, 1, 1, 0],
      transition: {
        duration: 2,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        ease: "easeInOut",
      }
    }
  },

  jackInTheBox: {
    style: { originX: 0.5, originY: 1 },
    initial: { opacity: 0, scale: 0.1, rotate: 30 },
    animate: {
      opacity: [0, 0, 0, 1],
      scale: [0.1, 0.1, 0.1, 1],
      rotate: [30, -10, 3, 0],
      transition: {
        duration: 1,
        times: [0, 0.5, 0.7, 1],
      }
    }
  },

  rollIn: {
    initial: { opacity: 0, x: "-100%", rotate: -120 },
    animate: {
      opacity: 1,
      x: 0,
      rotate: 0
    }
  },

  rollOut: {
    initial: { opacity: 1, x: 0, rotate: 0 },
    animate: {
      opacity: 0,
      x: "100%",
      rotate: 120
    }
  },

  
  zoomIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: {
      opacity: [0, 1],
      scale: [0.3, 1],
      transition: {
        times: [0, 0.5, 1]
      }
    }
  },

  zoomInDown: {
    initial: { opacity: 0, scale: 0.1, y: -1000 },
    animate: {
      opacity: [0, 1],
      scale: [0.1, 0.475, 1],
      y: [-1000, 60, 0],
      transition: {
        duration: 1,
        times: [0, 0.6, 1],
        ease: [[0.55, 0.055, 0.675, 0.19], [0.175, 0.885, 0.32, 1]]
      }
    }
  },

  zoomInLeft: {
    initial: { opacity: 0, scale: 0.1, x: -1000 },
    animate: {
      opacity: [0, 1],
      scale: [0.1, 0.475, 1],
      x: [-1000, 10, 0],
      transition: {
        duration: 1,
        times: [0, 0.6, 1],
        ease: [[0.55, 0.055, 0.675, 0.19], [0.175, 0.885, 0.32, 1]]
      }
    }
  },

  zoomInRight: {
    initial: { opacity: 0, scale: 0.1, x: 1000 },
    animate: {
      opacity: [0, 1],
      scale: [0.1, 0.475, 1],
      x: [1000, -10, 0],
      transition: {
        duration: 1,
        times: [0, 0.6, 1],
        ease: [[0.55, 0.055, 0.675, 0.19], [0.175, 0.885, 0.32, 1]]
      }
    }
  },

  zoomInUp: {
    initial: { opacity: 0, scale: 0.1, y: 1000 },
    animate: {
      opacity: [0, 1],
      scale: [0.1, 0.475, 1],
      y: [1000, -60, 0],
      transition: {
        duration: 1,
        times: [0, 0.6, 1],
        ease: [[0.55, 0.055, 0.675, 0.19], [0.175, 0.885, 0.32, 1]]
      }
    }
  },

  
  zoomOut: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: [1, 0, 0],
      scale: [1, 0.3, 0.3],
      transition: {
        times: [0, 0.5, 1]
      }
    }
  },

  zoomOutDown: {
    style: { originX: 0.5, originY: 1 },
    initial: { opacity: 1, scale: 1, y: 0 },
    animate: {
      opacity: [1, 1, 0],
      scale: [1, 0.475, 0.1],
      y: [0, -60, 2000],
      transition: {
        duration: 1,
        times: [0, 0.4, 1],
        ease: [[0.55, 0.055, 0.675, 0.19], [0.175, 0.885, 0.32, 1]],
      }
    }
  },

  zoomOutLeft: {
    style: { originX: 0, originY: 0.5 },
    initial: { opacity: 1, scale: 1, x: 0 },
    animate: {
      opacity: [1, 1, 0],
      scale: [1, 0.475, 0.1],
      x: [0, 42, -2000],
      transition: {
        duration: 1,
        times: [0, 0.4, 1],
      }
    }
  },

  zoomOutRight: {
    style: { originX: 1, originY: 0.5 },
    initial: { opacity: 1, scale: 1, x: 0 },
    animate: {
      opacity: [1, 1, 0],
      scale: [1, 0.475, 0.1],
      x: [0, -42, 2000],
      transition: {
        duration: 1,
        times: [0, 0.4, 1],
      }
    }
  },

  zoomOutUp: {
    style: { originX: 0.5, originY: 1 },
    initial: { opacity: 1, scale: 1, y: 0 },
    animate: {
      opacity: [1, 1, 0],
      scale: [1, 0.475, 0.1],
      y: [0, 60, -2000],
      transition: {
        duration: 1,
        times: [0, 0.4, 1],
        ease: [[0.55, 0.055, 0.675, 0.19], [0.175, 0.885, 0.32, 1]],
      }
    }
  },

  
  slideInDown: {
    initial: { y: "-100%" },
    animate: { y: 0 }
  },

  slideInLeft: {
    initial: { x: "-100%" },
    animate: { x: 0 }
  },

  slideInRight: {
    initial: { x: "100%" },
    animate: { x: 0 }
  },

  slideInUp: {
    initial: { y: "100%" },
    animate: { y: 0 }
  },

  
  slideOutDown: {
    initial: { y: 0 },
    animate: { y: "100%" }
  },

  slideOutLeft: {
    initial: { x: 0 },
    animate: { x: "-100%" }
  },

  slideOutRight: {
    initial: { x: 0 },
    animate: { x: "100%" }
  },

  slideOutUp: {
    initial: { y: 0, opacity: 1 },
    animate: {
      y: "-150%",
      opacity: 0,
      transition: {
        duration: 0.45,
        ease: "easeIn"
      }
    }
  }
};


export const allAnimations: Record<string, Variants> = {
  idle: {
    initial: { scale: 1, x: 0, y: 0, opacity: 1, rotate: 0 },
    animate: { scale: 1, x: 0, y: 0, opacity: 1, rotate: 0 },
  },
  
  
  ...animationVariants,
};
