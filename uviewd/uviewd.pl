#!/usr/bin/perl -W
# $Id$

use JSON::RPC::Server::Daemon;

use warnings;
use strict;

my $d = JSON::RPC::Server::Daemon->new(LocalPort => 24242);
$d->dispatch('UView');
$d->handle();
exit 0;
