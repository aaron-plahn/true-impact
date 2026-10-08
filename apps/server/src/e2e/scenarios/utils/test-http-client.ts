import axios from 'axios';

export interface Headers {
  Cookie: string[];
}

/**
 * We attempted to use tough-cookie and cookie-jar, but these led to friction
 * with our test build due to incompatible modules. Since this is only a test utility,
 * we implemented our own http client with cookies as this didn't take much time. A
 * nice side-effect is several less dependencies.
 */
export class TestHttpClient implements Omit<
  axios.AxiosInstance,
  'constructor' | 'query'
> {
  private axiosInstance: axios.AxiosInstance;

  private readonly cookies = new Map<string, string>();

  private authHeaders = new Map<string, string>();

  constructor(clientOrigin: string) {
    this.axiosInstance = axios.create({
      withCredentials: true,
      headers: {
        Origin: clientOrigin,
      },
    });

    this.axiosInstance.interceptors.response.use((config) => {
      if ('set-cookie' in config.headers) {
        const newCookiesFromResponse = config.headers['set-cookie'];

        if (newCookiesFromResponse) {
          for (const newCookie of newCookiesFromResponse) {
            // TODO Do we already depend on cookie parser middleware? Can we use this here?
            const cookieName = newCookie.split('=')[0];

            const expiry = newCookie.split('Expires=')[1].split(';')[0];

            if (expiry.includes('1970')) {
              this.cookies.delete(cookieName);
            } else {
              this.cookies.set(cookieName, newCookie);
            }
          }
        }
      }

      if ('st-access-token' in config.headers) {
        this.authHeaders.set(
          'st-access-token',
          config.headers['st-access-token'] as string,
        );
      }

      if ('st-refresh-token' in config.headers) {
        this.authHeaders.set(
          'st-refresh-token',
          config.headers['st-refresh-token'] as string,
        );
      }

      return config;
    });
  }

  create(_config?: axios.CreateAxiosDefaults): axios.AxiosInstance {
    throw new Error('Method not implemented.');
  }

  defaults: Omit<axios.AxiosDefaults<any>, 'headers'> & {
    headers: axios.HeadersDefaults & { [key: string]: axios.AxiosHeaderValue };
  };

  interceptors: {
    request: axios.AxiosInterceptorManager<axios.InternalAxiosRequestConfig>;
    response: axios.AxiosInterceptorManager<axios.AxiosResponse>;
  };

  getUri(_config?: axios.AxiosRequestConfig): string {
    throw new Error('Method not implemented.');
  }

  request<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    _config: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    throw new Error('Method not implemented.');
  }

  get<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    url: string,
    config?: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    return this.axiosInstance.get(url, this.configWithCredentials(config));
  }

  delete<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    url: string,
    config?: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    return this.axiosInstance.delete(url, this.configWithCredentials(config));
  }

  head<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    _url: string,
    _config?: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    throw new Error('Method not implemented.');
  }

  options<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    _url: string,
    _config?: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    throw new Error('Method not implemented.');
  }

  post<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    url: string,
    data?: D,
    config?: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    return this.axiosInstance.post<T, R, D>(
      url,
      data,
      this.configWithCredentials(config),
    );
  }

  put<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    url: string,
    data?: D,
    config?: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    return this.axiosInstance.put(
      url,
      data,
      this.configWithCredentials(config),
    );
  }

  patch<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    url: string,
    data?: D,
    config?: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    return this.axiosInstance.patch(
      url,
      data,
      this.configWithCredentials(config),
    );
  }

  postForm<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    _url: string,
    _data?: D,
    _config?: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    throw new Error('Method not implemented.');
  }

  putForm<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    _url: string,
    _data?: D,
    _config?: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    throw new Error('Method not implemented.');
  }

  patchForm<T = any, R = axios.AxiosResponse<T, any, Headers>, D = any>(
    _url: string,
    _data?: D,
    _config?: axios.AxiosRequestConfig<D>,
  ): Promise<R> {
    throw new Error('Method not implemented.');
  }

  private configWithCredentials(config: axios.AxiosRequestConfig = {}) {
    const Cookie = Array.from(this.cookies.values());

    const newConfig = {
      ...config,
      headers: {
        ...config.headers,
        Cookie,
      },
    };

    // TODO do we want this?
    if (this.authHeaders.has('st-access-token')) {
      if (!this.authHeaders.has('st-refresh-token')) {
        throw new Error(
          `Found a SuperTokens access token without an accompanying refresh token.`,
        );
      }

      Object.assign(newConfig, {
        'st-access-token': this.authHeaders.get('st-access-token'),
        'st-refresh-token': this.authHeaders.get('st-refresh-token'),
      });
    }

    return config;
  }
}
