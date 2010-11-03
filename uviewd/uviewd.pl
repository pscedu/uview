#!/usr/bin/perl -W
# $Id$

use warnings;
use strict;
use Getopt::Std;

sub usage {
	die <<EOF;
usage: $0 [-p port]
EOF
}

my %opts = (
	p => 24242,
);
getopts('p:', \%opts) or usage;
usage if @ARGV;

my $d = MyJSONServer->new(LocalPort => $opts{p});
$d->dispatch('UView');
$d->handle();
exit 0;

package MyJSONServer;

use warnings;
use strict;
use JSON::RPC::Server::Daemon;
use JSON;
use base qw(JSON::RPC::Server::Daemon);

sub retrieve_json_from_get {
	print STDERR "RETR\n";
	return encode_json({ version => 1.1, method => "uview" });
}
