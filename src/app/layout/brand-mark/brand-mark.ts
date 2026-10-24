import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

/** The sun setting behind the mountain, over the sea: the brand's mark. */
@Component({
  selector: 'lm-brand-mark',
  imports: [NgOptimizedImage],
  template: `<img ngSrc="icons/logo.png" width="256" height="256" alt="" />`,
  styles: `
    :host {
      display: inline-block;
      width: 2rem;
      height: 2rem;
      flex: none;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 31%;
    }
  `,
})
export class BrandMark {}
