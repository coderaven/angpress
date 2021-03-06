import { Injectable } from '@angular/core';
import { WordpressApiService } from './services/wordpress-api.service';
import {
  CategoryResponse,
  ViewPostResponse,
  MediaResponse,
  ViewUserResponse,
  ViewCommentResponse,
} from './models/wordpress.model';
import { Router } from '@angular/router';
import { fromEvent } from 'rxjs';

@Injectable()
export class AppService {
  categories: CategoryResponse[] = null; // for sidebar menu.
  categoryID: number = null; // for post category if there is category selected.
  comments: ViewCommentResponse[] = null; // container for comments.
  commentReply = {}; // store reply.
  posts: ViewPostResponse[] = null; // container for posts rendered in forum page.
  profileID: number = null; // reference pass to loadUserMedia and loadUserPosts.
  profileMedia: MediaResponse[] = null; // for media component.
  profilePosts: ViewPostResponse[] = null; // for profile posts.
  contributors: ViewUserResponse[] | any[] = null; // for contributor component.

  // Pagination
  length: number = null; // this holds the value from X-WP-Total
  page: number = null; // this holds the value from X-WP-TotalPages.
  pageIndex = 2; // this start with because the first page is already fetch.
  loading = false; // determine fetching request.

  constructor(public router: Router, public wp: WordpressApiService) {
    this.doInit();
  }

  /**
   * this initialized.
   */
  private doInit() {
    this.loadCategories();
    this.loadContributors();
  }

  /**
   * return true if logged in.
   */
  get isLoggedIn() {
    return !!this.wp.getID;
  }

  /**
   * return true if logged out.
   */
  get isLoggedOut() {
    return !this.isLoggedIn;
  }

  get isForum() {
    return window.location.pathname.split('/')[1] === 'forum';
  }

  /**
   * this is listening in the scroll event of mat-sidenav-content.
   * when page index is not equal to the X-WP-TotalPage,
   * it will fetch the remaining page when it scroll near the buttom,
   * until the index is equal to the X-WP-TotalPage.
   */
  scrollObserver() {
    const container = document.getElementsByTagName('mat-sidenav-content')[0];
    // listen to scroll event
    fromEvent(container, 'scroll').subscribe(() => {
      if (this.posts && this.posts.length <= this.length && this.pageIndex <= this.page && !this.loading) {
        if (container.scrollHeight - 1000 < container.scrollTop) {
          console.log('scrolltop:' + container.scrollTop, '   %40 scrollHeight: ' + container.scrollHeight);
          console.log(this.pageIndex);
          console.log('loading page' + this.pageIndex);
          this.loading = true;
          this.loadPosts('?page=' + this.pageIndex);
          this.pageIndex++;
        }
      }
    });
  }

  /**
   * will get categories from wordpress and store in categories.
   * and load posts if ever the pathname is forum with url param like discussion.
   */
  loadCategories() {
    this.wp.showCategory().subscribe(
      (data) => {
        this.categories = <CategoryResponse[]>data.body;

        const path = window.location.pathname.split('/');

        // detect if the pathname is in the forum
        if (path[1] === 'forum' && path[2] && path[2] !== 'post') {
          (<CategoryResponse[]>data.body).filter((category) => {
            if (path[2] === category.slug) {
              this.categoryID = category.id;
              this.loadPosts();
            }
          });
        }
      },
      (e) => this.errorLog(e, 'Show Categories'),
    );
  }

  /**
   * load contributors for forum.
   */
  loadContributors() {
    this.wp.showUser().subscribe(
      (data) => {
        this.contributors = <ViewUserResponse[]>data.body;
      },
      (e) => this.errorLog(e, 'Contributors'),
    );
  }

  /**
   * will get posts in specific category if category is not null,
   * else it will return posts regardless of their category(s).
   * @param param (optional) for pagination for now.
   */
  loadPosts(param?: string) {
    param ? (param += '&') : (param = '?');
    if (this.categoryID) {
      param += 'categories=' + this.categoryID + '&';
    }
    if (this.profileID) {
      param += 'author=' + this.profileID + '&';
    }
    param += '_embed';
    this.wp.showPost(param).subscribe(
      (data) => {
        this.length = parseInt(data.headers.get('X-WP-Total'), 10);
        this.page = parseInt(data.headers.get('X-WP-TotalPages'), 10);
        if (!this.posts) {
          this.pageIndex = 2;
          this.posts = <ViewPostResponse[]>data.body;
        } else {
          this.posts = [...this.posts, ...(<ViewPostResponse[]>data.body)];
        }
        this.loading = false;
      },
      (e) => this.errorLog(e, 'Posts'),
    );
  }

  /**
   * will return error using subscribe error handling.
   * @param e error object from angular.
   * @param from which request give this error (i.e. Login)
   */
  errorLog(e, from: string) {
    if (e.error.code && e.error.message) {
      console.log('Error Code ' + from + ' : ', e.error.code, '| Error Message ' + from + ' : ', e.error.message);
      alert('Error Code ' + from + ' : ' + e.error.code + '\nError Message ' + from + ' : ' + e.error.message);
    } else {
      if (e.error.code) {
        console.log('Error Code ' + from + ' : ', e.error.code);
        alert('Error Code ' + from + ' :' + e.error.code);
      }
      if (e.error.message) {
        console.log('Error Message ' + from + ' : ', e.error.message);
        alert('Error Message ' + from + ' : ' + e.error.message);
      }
    }
    console.log('Error HttpResponse :', e);
  }
}
