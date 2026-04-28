import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface Quiz {
  id: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  questionsCount: number;
  completed: boolean;
  reward: string;
}

@Component({
  selector: 'app-quizzes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.scss']
})
export class QuizzesComponent implements OnInit {
  quizzes: Quiz[] = [];

  selectedCategory = 'All';
  selectedDifficulty = 'All';

  categories = ['All', 'Geography', 'Nature', 'Culture'];
  difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  ngOnInit(): void {}

  get filteredQuizzes(): Quiz[] {
    return this.quizzes.filter(quiz => {
      const categoryMatch = this.selectedCategory === 'All' || quiz.category === this.selectedCategory;
      const difficultyMatch = this.selectedDifficulty === 'All' || quiz.difficulty === this.selectedDifficulty;
      return categoryMatch && difficultyMatch;
    });
  }

  startQuiz(_quiz: Quiz): void {}

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'Easy': return '#a8d97a';
      case 'Medium': return '#e0b478';
      case 'Hard': return '#d66a5a';
      default: return '#d4b98a';
    }
  }
}
