import { useEffect, useState } from "react";
import characterImage from "@/assets/character.png";

interface ExerciseCharacterProps {
  isActive: boolean;
  isRunning: boolean;
  timeLeft: number;
}

export const ExerciseCharacter = ({ isActive, isRunning, timeLeft }: ExerciseCharacterProps) => {
  const [animationState, setAnimationState] = useState<"idle" | "run" | "squat" | "jump" | "victory">("idle");

  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      setAnimationState("victory");
      setTimeout(() => {
        setAnimationState("idle");
      }, 3000);
    } else if (isRunning) {
      // Alternate between run, squat, jump during exercise
      const animations: ("run" | "squat" | "jump")[] = ["run", "squat", "jump"];
      let index = 0;
      const interval = setInterval(() => {
        setAnimationState(animations[index % animations.length]);
        index++;
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setAnimationState("idle");
    }
  }, [isActive, isRunning, timeLeft]);

  return (
    <div className="flex justify-center items-center py-8">
      <div className={`character-container ${animationState}`}>
        <img 
          src={characterImage} 
          alt="Exercise Character" 
          className="character-image"
        />
      </div>
      
      <style>{`
        .character-container {
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .character-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }

        /* Idle animation - gentle breathing */
        .character-container.idle .character-image {
          animation: idle 2s ease-in-out infinite;
        }

        @keyframes idle {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.02); }
        }

        /* Run animation - bouncing */
        .character-container.run .character-image {
          animation: run 0.6s ease-in-out infinite;
        }

        @keyframes run {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-15px) translateX(-5px); }
          50% { transform: translateY(0) translateX(0); }
          75% { transform: translateY(-15px) translateX(5px); }
        }

        /* Squat animation - up and down */
        .character-container.squat .character-image {
          animation: squat 1.5s ease-in-out infinite;
        }

        @keyframes squat {
          0%, 100% { transform: scaleY(1) translateY(0); }
          50% { transform: scaleY(0.8) translateY(20px); }
        }

        /* Jump animation - high jump */
        .character-container.jump .character-image {
          animation: jump 1s ease-in-out infinite;
        }

        @keyframes jump {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-40px) rotate(-5deg); }
          50% { transform: translateY(-60px) rotate(0deg); }
          75% { transform: translateY(-40px) rotate(5deg); }
        }

        /* Victory animation - celebration */
        .character-container.victory .character-image {
          animation: victory 0.8s ease-in-out 3;
        }

        @keyframes victory {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(-10deg); }
          50% { transform: scale(1.3) rotate(0deg); }
          75% { transform: scale(1.2) rotate(10deg); }
        }
      `}</style>
    </div>
  );
};
