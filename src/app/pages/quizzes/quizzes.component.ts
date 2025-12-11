import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';

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
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.scss']
})
export class QuizzesComponent implements OnInit {
  quizzes: Quiz[] = [
    {
      id: 1,
      title: 'European Capitals',
      description: 'Test your knowledge of European capital cities',
      difficulty: 'Easy',
      category: 'Geography',
      questionsCount: 10,
      completed: false,
      reward: '🇫🇷 France Card'
    },
    {
      id: 2,
      title: 'World Mountains',
      description: 'Identify the highest peaks around the globe',
      difficulty: 'Medium',
      category: 'Nature',
      questionsCount: 15,
      completed: true,
      reward: '🏔️ Mount Everest Card'
    },
    {
      id: 3,
      title: 'Major Rivers',
      description: 'Navigate through the world\'s longest rivers',
      difficulty: 'Hard',
      category: 'Geography',
      questionsCount: 20,
      completed: false,
      reward: '🌊 Amazon River Card'
    },
    {
      id: 4,
      title: 'African Countries',
      description: 'Explore the diverse nations of Africa',
      difficulty: 'Medium',
      category: 'Geography',
      questionsCount: 12,
      completed: false,
      reward: '🌍 Mystery African Card'
    }
  ];

  selectedCategory = 'All';
  selectedDifficulty = 'All';
  
  categories = ['All', 'Geography', 'Nature', 'Culture'];
  difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  ngOnInit(): void {
    // Simulation initialization
  }

  get filteredQuizzes(): Quiz[] {
    return this.quizzes.filter(quiz => {
      const categoryMatch = this.selectedCategory === 'All' || quiz.category === this.selectedCategory;
      const difficultyMatch = this.selectedDifficulty === 'All' || quiz.difficulty === this.selectedDifficulty;
      return categoryMatch && difficultyMatch;
    });
  }

  startQuiz(quiz: Quiz): void {
    console.log('Starting quiz:', quiz.title);
    // Mock quiz start
  }

  getDifficultyColor(difficulty: string): string {
    switch(difficulty) {
      case 'Easy': return '#00c9a7';
      case 'Medium': return '#f7931e';
      case 'Hard': return '#ff6b35';
      default: return '#fff';
    }
  }
}