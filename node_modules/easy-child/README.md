# easy-child

Wrappers to use node's child_process functions with asynchronous callbacks. 

## Examples

    var child = require('easy-child');
    
    var f = child.fork('./child.js');
    f.send('Hello, cruel world!');
    f.send('Die!');
    
    child.spawn('git', ['--version'], function (err, stdout) {
        if (err) {
            console.log(err, stdout);
        } else {
            console.log(stdout);
        }
    });
    
    child.exec('dir', {cwd: 'D:/Temp'}, function (error, stdout, stderr) {
        if (error) {
            console.log(error, stderr);
        } else {
            console.log(stdout);
        }
    });

## License

(The MIT License)

Copyright (c) 2014 [E2E Technologies Ltd](http://www.e2ebridge.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

by [E2E Technologies Ltd](http://www.e2ebridge.com)
