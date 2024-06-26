import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject, catchError, tap, throwError } from "rxjs";
import { User } from "./user.model";
import { Router } from "@angular/router";

export interface AuthResponseData{
    kind: string,
    idToken: string,
    email: string,
    refreshToken: string,
    expiresIn: string,
    localId: string,
    registered?: boolean // not returned in respone of signup, only returned at the time of login
}

@Injectable({providedIn: 'root'})  // sortcut to directly include the service in the root
export class AuthService{
    // user  = new Subject<User>();
    user  = new BehaviorSubject<User>(null); // same as subject, additionally can access latest
    private tokenExpirationTimer: any;

    constructor(private http: HttpClient, private router: Router){}

    guest(){
        const expirationDate = new Date(new Date().getTime()+ 5*1000);
        const user = new User('email', 'userId', 'token', expirationDate);
        this.user.next(user);
        localStorage.setItem('userData',JSON.stringify(user));
        this.autoLogout(5000);
    }

    autoLogin(){
        const userData = JSON.parse(localStorage.getItem('userData'));
        if(!userData){
            return;
        }
        const loadedUser = new User(userData.email, userData.id, userData._token, new Date(userData._tokenExpirationDate));
        if(loadedUser.token){
            this.user.next(loadedUser);
            const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
            this.autoLogout(expirationDuration);
        }
    }

    signup(email: string, password: string){
        return this.http.post<AuthResponseData>(
            'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=[API_KEY]', // add the api key at the place of [API_KEY]
            {
                email: email,
                password: password,
                returnSecureToken: true
            }
            )
            .pipe(catchError(this.handleError),
            tap(resData => {
                this.handleAuthentication(
                    resData.email,
                    resData.localId,
                    resData.idToken,
                    +resData.expiresIn
                )
            })
            );
    }
    login(email: string, password: string){
        return this.http.post<AuthResponseData>(
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=[API_KEY]', // add the api key at the place of [API_KEY]
            {
                email: email,
                password: password,
                returnSecureToken: true
            }
            )
            .pipe(catchError(this.handleError),
            tap(resData => {
                this.handleAuthentication(
                    resData.email,
                    resData.localId,
                    resData.idToken,
                    +resData.expiresIn
                )
            })
            );
    }

    private handleAuthentication(email: string, userId: string, token: string, expiresIn: number){
                const expirationDate = new Date(new Date().getTime()+ expiresIn*1000);
                const user = new User(email, userId, token, expirationDate);
                this.user.next(user);
                this.autoLogout(expiresIn*1000);
                localStorage.setItem('userData',JSON.stringify(user));
    }

    private handleError(errorRes: HttpErrorResponse){
        let errorMsg = 'An unknown error occured!';
                if(!errorRes.error || !errorRes.error.error){
                    return throwError(() =>errorMsg);
                }
                switch (errorRes.error.error.message){
                    case 'EMAIL_EXISTS':
                        errorMsg = 'This email already exists';
                        break;
                    case 'EMAIL_NOT_FOUND':
                        errorMsg = 'This email does not exist';
                        break;
                    case 'INVALID_PASSWORD':
                        errorMsg = 'This password is not correct';
                        break;
                }
                return throwError(() =>errorMsg);
    }

    logout(){
        alert("Please Login Again");
        this.user.next(null);
        this.router.navigate(['./auth']);
        localStorage.removeItem('userData');
        if(this.tokenExpirationTimer){
            clearTimeout(this.tokenExpirationTimer);
        }
    }

    autoLogout(expirationDuration: number){
        this.tokenExpirationTimer = setTimeout(()=> {
            this.logout();
        }, expirationDuration);
    }
}