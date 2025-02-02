/**
 * (C) Copyright IBM Corp. 2020, 2021.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const tough = require('tough-cookie');
const { RequestWrapper } = require('../../dist/lib/request-wrapper');

describe('cookie jar support', () => {
  it('should not wrap the axios instance by default', () => {
    const wrapper = new RequestWrapper();
    expect(wrapper.axiosInstance.defaults.withCredentials).not.toBeDefined();
    expect(wrapper.axiosInstance.interceptors.request.handlers).toHaveLength(0);
  });

  it('passing a value for `jar` should produce interceptors and set flags', () => {
    const wrapper = new RequestWrapper({ jar: true });
    expect(wrapper.axiosInstance.defaults.withCredentials).toBe(true);
    expect(wrapper.axiosInstance.interceptors.request.handlers).toHaveLength(1);
  });

  it('given `true` for `jar`, the interceptors should create an instance of tough-cookie', () => {
    const wrapper = new RequestWrapper({ jar: true });

    expect(wrapper.axiosInstance.interceptors.request.handlers).toHaveLength(1);
    expect(wrapper.axiosInstance.interceptors.request.handlers[0].fulfilled).toBeInstanceOf(
      Function
    );

    // should initially set the default to true
    expect(wrapper.axiosInstance.defaults.jar).toBe(true);

    // invoke the interceptor - it should be the one added by the cookie jar library
    // it should see that `jar` is `true` and create a default instance of tough.CookieJar
    // this would noramlly happen just before a request is sent
    wrapper.axiosInstance.interceptors.request.handlers[0].fulfilled(
      wrapper.axiosInstance.defaults
    );

    expect(wrapper.axiosInstance.defaults.jar).toBeInstanceOf(tough.CookieJar);
  });

  it('given arbitrary value for `jar`, the interceptor should use it as cookie jar', () => {
    // the axios-cookiejar-support interceptor requires the jar object
    // to have the method `getCookieString`
    const mockCookieJar = { getCookieString: () => 'mock-string' };
    const wrapper = new RequestWrapper({ jar: mockCookieJar });

    // should still set interceptors and withCredentials flag
    expect(wrapper.axiosInstance.interceptors.request.handlers).toHaveLength(1);
    expect(wrapper.axiosInstance.defaults.withCredentials).toBe(true);
    expect(wrapper.axiosInstance.defaults.jar).toEqual(mockCookieJar);

    // invoke the interceptor, the default jar should remain the same
    wrapper.axiosInstance.interceptors.request.handlers[0].fulfilled(
      wrapper.axiosInstance.defaults
    );

    expect(wrapper.axiosInstance.defaults.jar).toEqual(mockCookieJar);
  });
});
