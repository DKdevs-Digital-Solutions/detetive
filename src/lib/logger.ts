import { ConfidenceLevel, UsageStats } from '@/types';

class Logger {
  private visitors = 0;
  private questions = 0;
  private newsAnalyzed = 0;
  private greenCount = 0;
  private yellowCount = 0;
  private redCount = 0;
  private quizScores: number[] = [];
  private startedAt = new Date().toISOString();

  logVisitor() {
    this.visitors++;
  }

  logQuestion() {
    this.questions++;
  }

  logAnalysis(level: ConfidenceLevel) {
    this.newsAnalyzed++;
    if (level === 'green') this.greenCount++;
    else if (level === 'yellow') this.yellowCount++;
    else this.redCount++;
  }

  logQuizScore(score: number) {
    this.quizScores.push(score);
  }

  getStats(): UsageStats {
    const avg =
      this.quizScores.length > 0
        ? Math.round(
            this.quizScores.reduce((a, b) => a + b, 0) / this.quizScores.length
          )
        : 0;

    return {
      visitors: this.visitors,
      questions: this.questions,
      newsAnalyzed: this.newsAnalyzed,
      greenCount: this.greenCount,
      yellowCount: this.yellowCount,
      redCount: this.redCount,
      quizAvgScore: avg,
      startedAt: this.startedAt,
    };
  }

  reset() {
    this.visitors = 0;
    this.questions = 0;
    this.newsAnalyzed = 0;
    this.greenCount = 0;
    this.yellowCount = 0;
    this.redCount = 0;
    this.quizScores = [];
    this.startedAt = new Date().toISOString();
  }
}

// Singleton — persists across API route calls in the same process
export const logger = new Logger();
