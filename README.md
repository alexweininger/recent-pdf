[logo]: https://raw.githubusercontent.com/alexweininger/recent-pdf/dev/content/promotional/pr1400v2.png ""

[screenshot]: https://user-images.githubusercontent.com/12476526/71236611-3fea5180-22b4-11ea-8204-f73e68324815.png ""

# ![error][logo]

![MIT License](https://img.shields.io/github/license/alexweininger/recent-pdf.svg?style=flat-square) ![chrome users](https://img.shields.io/chrome-web-store/users/ihjgdammecebcjinfmllgniaeneabkdk.svg?label=chrome%20users&style=flat-square) ![webstore rating](https://img.shields.io/chrome-web-store/stars/ihjgdammecebcjinfmllgniaeneabkdk.svg?label=webstore%20rating&style=flat-square) [![HitCount](http://hits.dwyl.io/alexweininger/recent-pdf.svg)](http://hits.dwyl.io/alexweininger/recent-pdf)

RecentPDF is a simple and helpful Chrome extension to make accessing PDF files quick and easy.

**You can download and install RecentPDF from the Chrome webstore [here](https://chrome.google.com/webstore/detail/recent-pdf/ihjgdammecebcjinfmllgniaeneabkdk).**

# ![error][screenshot]

## Features

- Pop up displaying recently view or downloaded **local** and **online** PDF files.
- Ability to open local PDF file in file explorer.
- Open PDF file in PDF viewer of choice.

## Getting Started

1. Fork or clone the this repository.

2. open Chrome, and then go to your extensions page. [chrome://extensions/](chrome://extensions/)

3. In the top right, make sure 'Developer Mode' is enabled.

4. Now select the 'Load Unpacked' button and select the folder containing RecentPDF.

5. Make sure to enable the extension and you're all set!

More detailed instructions can be found in the Contributing section below.

## Contributing

RecentPDF is a simple extension made with Javascript. If you know a little bit of Javascript you can most likely help develop this project.

To begin working on this project follow these steps.

1. Fork the recent-pdf repository.
2. Clone the forked repository to your local machine.
3. Run `npm install` (or `yarn install` if you are using Yarn)
4. Run `npm run watch` (or `yarn run watch`)
5. Add the local extension to Chrome.
   1. Go to Chrome -> Extensions
   2. Enable Developer Mode
   3. Select "Load unpacked extension" and select the `dist/` directory of the recent-pdf clone you're working on.
6. The RecentPDF extension is now loaded into Chrome, and will reflect the changes you make the the local clone.
7. Once you've finished developing, push the repository.
8. Make a pull request and explain what changes have been made.

### Debugging

If you're not doing anything really UI specific, then you can load the popup content in a normal browser window.

1. find the ID: for the recent pdf extension in `chrome://chrome/extensions/`

2. You can then load your popup in a regular window by `chrome-extension://id_of_your_application/index.html`

You can also open up the Chrome Dev Tools window for the popup by right clicking and selecting inspect popup. Be careful when using this method since your breakpoints might not be hit since the popup runs scripts before the user clicks to open it. If this happens, reload the Chrome Dev Tools by pressing `Ctrl + R`.

Please feel free to contact me with any comments, improvements, or if you would like to help me with this project or any others.



<!-- TODO -->
<!-- Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us. -->

<!-- TODO contributors list -->
<!-- BUG -->
<!-- See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project. -->

## Built Proudly with

- [vscode](https://code.visualstudio.com/)
- [TypeScript](https://www.typescriptlang.org/index.html)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Chrome API docs
- All the professors who upload so many PDF files
- vscode
- All Hacktoberfest contributors!
