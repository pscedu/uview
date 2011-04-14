#!/usr/bin/perl -W
# $Id$
# %PSC_START_COPYRIGHT%
# -----------------------------------------------------------------------------
# Copyright (c) 2010-2011, Pittsburgh Supercomputing Center (PSC).
#
# Permission to use, copy, and modify this software and its documentation
# without fee for personal use or non-commercial use within your organization
# is hereby granted, provided that the above copyright notice is preserved in
# all copies and that the copyright and this permission notice appear in
# supporting documentation.  Permission to redistribute this software to other
# organizations or individuals is not permitted without the written permission
# of the Pittsburgh Supercomputing Center.  PSC makes no representations about
# the suitability of this software for any purpose.  It is provided "as is"
# without express or implied warranty.
# -----------------------------------------------------------------------------
# %PSC_END_COPYRIGHT%

use warnings;
use strict;
use Getopt::Std;

sub usage {
	die <<EOF;
usage: $0 [-p port]
EOF
}

my %opts = (
	p => 24240,
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
use Data::Dumper;

sub retrieve_json_from_get {
	return encode_json({ version => 1.1, method => "uview" });
}

sub response {
	my ($self, $response) = @_;
	my $t = $response->{_content};
	$response->{_content} = q{data = } . $t;
	$response->{_headers}{'content-type'} =~
	    s{application/json}{text/javascript};
	$self->{con}->send_response($response);
}
