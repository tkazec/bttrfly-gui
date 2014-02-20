#!/bin/bash
# $ bash build.sh outdmg

SRCDIR="$( cd "$( dirname "$0" )" && pwd )"
TMPDIR=$SRCDIR/temp
ALLDIR=$SRCDIR/../..
OUTDMG=$1

mkdir $TMPDIR

curl --output $TMPDIR/nw.zip https://s3.amazonaws.com/node-webkit/v0.8.4/node-webkit-v0.8.4-osx-ia32.zip
unzip -q -d $TMPDIR $TMPDIR/nw.zip
mv $TMPDIR/node-webkit.app $TMPDIR/bttrfly.app

cp $SRCDIR/Info.plist $TMPDIR/bttrfly.app/Contents
cp $SRCDIR/nw.icns $TMPDIR/bttrfly.app/Contents/Resources

mkdir $TMPDIR/bttrfly.app/Contents/Resources/app.nw
cp -R $ALLDIR/scripts $ALLDIR/styles $ALLDIR/views $ALLDIR/index.html $ALLDIR/package.json $TMPDIR/bttrfly.app/Contents/Resources/app.nw

hdiutil create -ov -srcfolder $TMPDIR/bttrfly.app $OUTDMG

rm -rf $TMPDIR